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

// Strips markdown symbols, asterisks, URLs, and emojis so spoken text sounds natural
function cleanTextForSpeech(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^[*\-•]\s+/gm, '')
    .replace(/[👉⚠️✅ℹ️📌🔹🔸•]/g, '')
    .replace(/https?:\/\/\S+/g, 'website')
    .replace(/\n+/g, '. ')
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
function splitIntoSentences(text) {
  const cleaned = cleanTextForSpeech(text)
  const sentences = cleaned.match(/[^.!?।\n]+[.!?।\n]+|\s*[^.!?।\n]+$/g)
  return (sentences || [cleaned]).map((s) => s.trim()).filter(Boolean)
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

let speechQueue = []
let isSpeakingQueue = false

function speakNextInQueue(lang) {
  if (speechQueue.length === 0) {
    isSpeakingQueue = false
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

  utterance.onend = () => speakNextInQueue(lang)
  utterance.onerror = () => speakNextInQueue(lang)
  window.speechSynthesis.speak(utterance)
}

export function speakText(text, lang = 'hi-IN') {
  if (!isVoiceOutputSupported) return
  window.speechSynthesis.cancel()
  speechQueue = []
  isSpeakingQueue = false

  waitForVoices().then(() => {
    setTimeout(() => {
      speechQueue = splitIntoSentences(text)
      speakNextInQueue(lang)
    }, 120)
  })
}

export function stopSpeaking() {
  if (isVoiceOutputSupported) {
    speechQueue = []
    isSpeakingQueue = false
    window.speechSynthesis.cancel()
  }
}
