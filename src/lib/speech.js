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

// Starts listening for speech and returns a controller object with a stop() method.
export function startListening({ lang = 'hi-IN', onResult, onEnd, onError }) {
  if (!SpeechRecognitionAPI) {
    onError?.('Voice input is not supported in this browser. Try Chrome or Edge.')
    return { stop: () => {} }
  }

  const recognition = new SpeechRecognitionAPI()
  recognition.lang = lang
  recognition.interimResults = true
  recognition.continuous = true // Continuous listening prevents premature cutoff when citizen pauses
  let manualStop = false

  recognition.onresult = (event) => {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' '
      } else {
        interimTranscript += result[0].transcript
      }
    }

    const combined = (finalTranscript + interimTranscript).trim()
    const isLastFinal = event.results[event.results.length - 1]?.isFinal || false
    onResult?.(combined, isLastFinal)
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
