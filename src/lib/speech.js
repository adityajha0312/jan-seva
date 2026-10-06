// Wraps the browser's built-in Web Speech API.
// Voice input (SpeechRecognition) and voice output (SpeechSynthesis) are
// both free and built into Chrome/Edge - no API key needed.

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export const isVoiceInputSupported = !!SpeechRecognitionAPI
export const isVoiceOutputSupported =
  typeof window !== 'undefined' && !!window.speechSynthesis

let speechQueue = []
let isSpeakingQueue = false
let currentOnEndCallback = null

// Phonetic corrector for Indian governance & citizen welfare terms.
// Browser Web Speech API frequently mishears "किसान" / "किशन" as "किश" ("kish") or "किस" ("kiss"), etc.
export function correctSpeechTranscript(text, lang = 'hi-IN') {
  if (!text) return ''
  let corrected = text

  // 1. Collapse immediate stuttered/repeated words (e.g. "मैं मैं मैं मैं" -> "मैं")
  corrected = corrected.replace(/(\b[\u0900-\u097F\w]+\b)(?:\s+\1\b)+/gi, '$1')

  // 2. Collapse repeated adjacent multi-word clauses from mobile speech glitches
  corrected = corrected.replace(/(.{4,40}?)\s+\1(?:\s+\1)*/gi, '$1')

  // 3. "किश / किस / किशन / किसन / kish / kiss / kis / kishan" -> "किसान" (Farmer) corrections:
  // Matches "मैं किश हूँ", "मैं किस हूं", "मैं किश", "मैं किस", "मैं किशन हूँ", "हम किस हैं"
  corrected = corrected.replace(
    /\b(मैं|हम)\s+(?:एक\s+)?(?:किश|किस|किशन|किसन|kiss|kish|kis|kishan)\s*(हूँ|हूं|हु|हैं|हे)?\b/gi,
    (m, p1, p2) => `${p1} किसान ${p2 || 'हूँ'}`
  )

  // Matches standalone "किश हूँ", "किस हूँ", "किशन हूँ", "किसन हूँ", "kish hu"
  corrected = corrected.replace(
    /\b(?:किश|किस|किशन|किसन|kiss|kish|kis|kishan)\s+(हूँ|हूं|हु|हैं|हे)\b/gi,
    'किसान $1'
  )

  // Matches "किश भाई", "किस भाई", "किशन भाई", "किस परिवार", "किस क्रेडिट"
  corrected = corrected.replace(
    /\b(?:किश|किस|किशन|किसन)\s+(भाई|परिवार|कल्याण|क्रेडिट|योजना|आंदोलन|मित्र)\b/gi,
    'किसान $1'
  )

  // If sentence contains agriculture context words (जमीन, एकड़, हेक्टेयर, फसल, खेती, बीघा, खसरा, पटवारी, खाद, बीज, khet, land, acre, crop),
  // convert any standalone "किश", "किस", "किशन", "किसन", "kish", or "kiss" to "किसान" (excluding questions like "किस योजना/फसल")
  const hasFarmingContext = /(?:जमीन|एकड़|एकड|हेक्टेयर|फसल|खेती|बीघा|खसरा|खाद|बीज|पटवारी|बोनी|कृषि|khet|land|acre|crop|cultivat)/i.test(corrected)
  if (hasFarmingContext) {
    corrected = corrected.replace(
      /\b(?:किश|किस|किशन|किसन|kiss|kish|kis)\b(?!\s*(?:योजना|फसल|दस्तावेज|दस्तावेज़|प्रकार|तरह|बैंक|तारीख|तारीख़|समय))/gi,
      'किसान'
    )
  }

  // English / Hinglish: "I am a kiss/kish", "main kiss/kish hoon", "kiss farmer"
  corrected = corrected.replace(/\b(main|mai)\s+(?:ek\s+|a\s+)?(?:kiss|kis|kish|kishan)\s*(hoon|hu|hun)?\b/gi, '$1 kisan $2')
  corrected = corrected.replace(/\bI\s+am\s+(?:a\s+)?(?:kiss|kis|kish|kishan)\b/gi, 'I am a farmer')

  // 4. Ladli Behna & Women scheme corrections
  corrected = corrected.replace(/\b(लाडली|लाडली|लाड़ली)\s*(बहना|बहन|बेहना)\b/gi, 'लाड़ली बहना')

  // 5. Samagra ID corrections
  corrected = corrected.replace(/\bसमग्र\s*आई\s*डी\b/gi, 'समग्र आईडी')

  // 6. Ayushman Bharat corrections
  corrected = corrected.replace(/\b(आयुष्मान|आयुस्मान)\s*(भारत)?\b/gi, 'आयुष्मान भारत')

  // 7. Sambal Yojana corrections
  corrected = corrected.replace(/\b(संबल|सम्बल)\s*(योजना)?\b/gi, 'संबल योजना')

  return corrected.trim()
}

// Starts listening for speech and returns a controller object with a stop() method.
export function startListening({ lang = 'hi-IN', onResult, onEnd, onError }) {
  if (!SpeechRecognitionAPI) {
    onError?.('Voice input is not supported in this browser. Try Chrome or Edge.')
    return { stop: () => {} }
  }

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const recognition = new SpeechRecognitionAPI()
  recognition.lang = lang
  recognition.interimResults = true
  // On mobile (Android Chrome), continuous: true causes severe duplicate transcript looping
  // ("main main main main kish..."). Single-utterance mode is clean and stable.
  recognition.continuous = !isMobile
  let manualStop = false

  recognition.onresult = (event) => {
    let finalTranscript = ''
    let interimTranscript = ''

    if (isMobile) {
      // On mobile devices, grab the current active result directly to prevent cumulative loop repeats
      const lastIdx = event.results.length - 1
      const res = event.results[lastIdx]
      if (res && res[0]) {
        const text = res[0].transcript
        if (res.isFinal) {
          finalTranscript = text
        } else {
          interimTranscript = text
        }
      }
    } else {
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
        } else {
          interimTranscript += result[0].transcript
        }
      }
    }

    const combined = (finalTranscript + interimTranscript).trim()
    const correctedCombined = correctSpeechTranscript(combined, lang)
    const isLastFinal = event.results[event.results.length - 1]?.isFinal || false
    onResult?.(correctedCombined, isLastFinal)
  }

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      return
    }
    onError?.(event.error)
  }

  recognition.onend = () => {
    onEnd?.(manualStop)
  }

  try {
    recognition.start()
  } catch (e) {
    onError?.(e.message)
  }

  return {
    stop: () => {
      manualStop = true
      try {
        recognition.stop()
      } catch (e) {}
    },
  }
}

// Strips markdown symbols, asterisks, URLs, and emojis so spoken text sounds natural.
// Also cleans bracketed translation words based on the target language.
function cleanTextForSpeech(text, lang = 'hi-IN') {
  if (!text) return ''
  let cleaned = text
    .replace(/^(?:हाँ\s*(?:बिल्कुल)?,?\s*)?मैं\s*आपको\s*बोलकर\s*बता\s*रहा\s*हूँ[।.]?\s*/i, '')
    .replace(/^Certainly,?\s*I am reading this aloud for you[.]?\s*/i, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[*\-•]\s+/gm, '')
    .replace(/[👉⚠️✅ℹ️📌🔹🔸•|~_`]/g, '')
    .replace(/https?:\/\/\S+/g, '')

  const langPrefix = (lang || 'hi-IN').split('-')[0].toLowerCase()

  if (langPrefix === 'en') {
    // English mode:
    // 1. Remove all Devanagari / Tamil words in parentheses or brackets (e.g. "(जन सेवा)")
    cleaned = cleaned.replace(/\([^)]*[\u0900-\u097F\u0B80-\u0BFF][^)]*\)/g, '')
    cleaned = cleaned.replace(/\[[^\]]*[\u0900-\u097F\u0B80-\u0BFF][^\]]*\]/g, '')
    // 2. Strip any remaining Devanagari or Tamil words completely
    cleaned = cleaned.replace(/[\u0900-\u097F\u0B80-\u0BFF]+/g, '')
  } else if (langPrefix === 'hi' || langPrefix === 'mr') {
    // Hindi / Marathi mode:
    // 1. Remove all English words in parentheses or brackets (e.g. "(Jan Seva)", "(Farmer)", "(PM-KISAN)")
    cleaned = cleaned.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '')
    cleaned = cleaned.replace(/\[[^\]]*[a-zA-Z][^\]]*\]/g, '')
  } else if (langPrefix === 'ta') {
    // Tamil mode:
    // Remove English and Devanagari words in parentheses or brackets
    cleaned = cleaned.replace(/\([^)]*[a-zA-Z\u0900-\u097F][^)]*\)/g, '')
    cleaned = cleaned.replace(/\[[^\]]*[a-zA-Z\u0900-\u097F][^\]]*\]/g, '')
  }

  // Remove leftover empty brackets and normalize spaces
  cleaned = cleaned.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '')
  return cleaned.replace(/\n+/g, '. ').trim()
}

let voicesReadyPromise = null

function waitForVoices() {
  if (!isVoiceOutputSupported) return Promise.resolve()
  if (voicesReadyPromise) return voicesReadyPromise

  voicesReadyPromise = new Promise((resolve) => {
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve()
      return
    }
    const timeout = setTimeout(resolve, 1000)
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout)
      resolve()
    }
  })
  return voicesReadyPromise
}

// Splits text into sentence-sized chunks including Hindi danda (।) and newlines.
// Filters out sentences that belong to a different language script so English assistant
// only speaks English and Hindi assistant only speaks Hindi.
function splitIntoSentences(text, lang = 'hi-IN') {
  const cleaned = cleanTextForSpeech(text, lang)
  const sentences = cleaned.match(/[^.!?।\n]+[.!?।\n]+|\s*[^.!?।\n]+$/g)
  const rawList = (sentences || [cleaned]).map((s) => s.trim()).filter(Boolean)

  const langPrefix = (lang || 'hi-IN').split('-')[0].toLowerCase()

  return rawList.filter((s) => {
    const alphanumeric = s.replace(/[^a-zA-Z0-9\u0900-\u097F\u0B80-\u0BFF]/g, '')
    if (alphanumeric.length < 2) return false

    if (langPrefix === 'en') {
      // English assistant: Must have English Latin letters, skips pure Hindi/Tamil sentences
      return /[a-zA-Z]/.test(s)
    }

    if (langPrefix === 'hi' || langPrefix === 'mr') {
      // Hindi / Marathi assistant: Must have Devanagari script, skips pure English sentences
      return /[\u0900-\u097F]/.test(s)
    }

    if (langPrefix === 'ta') {
      // Tamil assistant: Must have Tamil script, skips pure English/Hindi sentences
      return /[\u0B80-\u0BFF]/.test(s)
    }

    return true
  })
}

// Automatically detect the script/language of the sentence so the browser picks the correct voice engine
function detectScriptLanguage(text, fallbackLang = 'en-IN') {
  // Check for Devanagari script (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi-IN'
  }
  // Check for Tamil script
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'ta-IN'
  }
  // Default to the user's selected fallback language or English
  return fallbackLang || 'en-IN'
}

function speakNextInQueue(lang, onEnd) {
  if (speechQueue.length === 0) {
    isSpeakingQueue = false
    if (currentOnEndCallback) {
      const cb = currentOnEndCallback
      currentOnEndCallback = null
      cb()
    }
    return
  }
  isSpeakingQueue = true
  const sentence = speechQueue.shift()
  const targetLang = detectScriptLanguage(sentence, lang)

  const utterance = new SpeechSynthesisUtterance(sentence)
  utterance.lang = targetLang
  utterance.rate = 0.95

  // Pick an authentic native voice matching the sentence's actual script/language
  try {
    const voices = window.speechSynthesis.getVoices()
    if (voices && voices.length > 0) {
      const langPrefix = targetLang.split('-')[0].toLowerCase()

      // 1. Try exact language match (e.g. 'hi-IN', 'en-IN')
      let matched = voices.find(
        (v) => v.lang.toLowerCase() === targetLang.toLowerCase()
      )

      // 2. Try language prefix match (e.g. 'hi', 'en')
      if (!matched) {
        matched = voices.find(
          (v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
        )
      }

      // 3. Fallback check for voice names (e.g. "Google हिन्दी", "Microsoft Kalpana", "Microsoft Hemant")
      if (!matched && langPrefix === 'hi') {
        matched = voices.find((v) => /hindi|kalpana|hemant|hi[-_]in/i.test(v.name))
      }

      if (matched) {
        utterance.voice = matched
      }
    }
  } catch (e) {}

  utterance.onend = () => speakNextInQueue(lang, onEnd)
  utterance.onerror = () => speakNextInQueue(lang, onEnd)
  window.speechSynthesis.speak(utterance)
}

export function speakText(text, lang = 'hi-IN', options = {}) {
  if (!isVoiceOutputSupported) return
  try {
    window.speechSynthesis.cancel()
  } catch (e) {}
  speechQueue = []
  isSpeakingQueue = false

  const onStart = typeof options === 'function' ? null : options?.onStart
  const onEnd = typeof options === 'function' ? options : options?.onEnd
  currentOnEndCallback = onEnd || null

  waitForVoices().then(() => {
    setTimeout(() => {
      speechQueue = splitIntoSentences(text, lang)
      if (speechQueue.length > 0) {
        if (onStart) onStart()
        speakNextInQueue(lang, onEnd)
      } else {
        if (onEnd) onEnd()
      }
    }, 120)
  })
}

export function stopSpeaking() {
  if (isVoiceOutputSupported) {
    speechQueue = []
    isSpeakingQueue = false
    if (currentOnEndCallback) {
      const cb = currentOnEndCallback
      currentOnEndCallback = null
      try { cb() } catch (e) {}
    }
    try {
      window.speechSynthesis.cancel()
    } catch (e) {}
  }
}
