const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Primary, fallback, and candidate models for Google AI Studio
const KNOWN_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-4-argon',
]

let discoveredModel = null

// Dynamically retrieves the active supported model for this specific API key if needed
async function getAvailableModel(apiKey) {
  if (discoveredModel) return discoveredModel

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`)
    if (res.ok) {
      const data = await res.json()
      const models = data?.models || []
      const candidate = models.find((m) =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        (m.name.includes('flash') || m.name.includes('3.8') || m.name.includes('3.5'))
      ) || models.find((m) => m.supportedGenerationMethods?.includes('generateContent'))

      if (candidate?.name) {
        discoveredModel = candidate.name.replace(/^models\//, '')
        return discoveredModel
      }
    }
  } catch (e) {
    console.warn('Could not auto-discover model:', e)
  }
  return KNOWN_MODELS[0]
}

// Waits `ms` milliseconds before continuing.
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Parses JSON or plain text error from Google Gemini API response
function parseGoogleError(status, errText) {
  try {
    const parsed = JSON.parse(errText)
    if (parsed?.error?.message) {
      return parsed.error.message
    }
  } catch (_) {}
  return errText ? errText.slice(0, 200) : `HTTP ${status}`
}

// Calls the Gemini API with automatic model fallbacks, clear diagnostics, and exponential backoff
export async function askGemini(systemInstruction, conversationHistory, jsonMode = false) {
  // 1. Guard against missing environment variable (common in Vercel deployments)
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '' || GEMINI_API_KEY.includes('your_')) {
    throw new Error(
      'VITE_GEMINI_API_KEY is missing! Please go to Vercel Project Settings → Environment Variables, add VITE_GEMINI_API_KEY with your Google AI Studio API key, and Redeploy.'
    )
  }

  // Ensure multi-turn conversation starts with user turn and filter leading assistant greeting
  let formattedContents = conversationHistory
    .filter((msg, idx) => !(idx === 0 && msg.role === 'assistant'))
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }))

  if (formattedContents.length === 0) {
    formattedContents = [{ role: 'user', parts: [{ text: 'Hello' }] }]
  }

  // Keep the most recent 12 turns for instant response latency while preserving conversation context
  if (formattedContents.length > 12) {
    formattedContents = formattedContents.slice(-12)
    if (formattedContents[0].role === 'model') {
      formattedContents = formattedContents.slice(1)
    }
  }

  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: formattedContents,
    generationConfig: {
      temperature: jsonMode ? 0.2 : 0.35,
      maxOutputTokens: 2048,
      topP: 0.85,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  const modelsToTry = discoveredModel
    ? [discoveredModel, ...KNOWN_MODELS.filter((m) => m !== discoveredModel)]
    : [...KNOWN_MODELS]

  let lastError = null

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i]
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify(body),
        })

        if (response.status === 429) {
          const errText = await response.text()
          const detail = parseGoogleError(response.status, errText)
          throw new Error(
            `Google AI Studio Free Quota / Rate limit (HTTP 429): ${detail}. Please wait 30 seconds or create a new free API key at aistudio.google.com and update Vercel.`
          )
        }

        if (!response.ok) {
          const errText = await response.text()
          const detail = parseGoogleError(response.status, errText)

          // If the API key is rejected or invalid, halt immediately with the true error
          if (
            response.status === 400 &&
            (detail.toLowerCase().includes('api key') || detail.toLowerCase().includes('invalid_argument'))
          ) {
            throw new Error(`Google API Key Invalid: ${detail}. Please check your VITE_GEMINI_API_KEY.`)
          }

          if (response.status === 403) {
            throw new Error(`Google Gemini Access Forbidden: ${detail}. Please enable Generative Language API in Google Cloud / AI Studio.`)
          }

          if (response.status === 404) {
            lastError = `Model ${model} not found: ${detail}`
            // Try auto-discovering working model from Google AI Studio list
            if (!discoveredModel && i === 0) {
              const liveModel = await getAvailableModel(GEMINI_API_KEY)
              if (liveModel && !modelsToTry.includes(liveModel)) {
                modelsToTry.splice(i + 1, 0, liveModel)
              }
            }
            break // try fallback model
          }

          lastError = `Gemini API error (${response.status}): ${detail}`
          break
        }

        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          throw new Error('No response text received from Gemini')
        }
        discoveredModel = model // Cache working model for lightning-fast future calls
        return text
      } catch (err) {
        lastError = err.message
        // Stop immediately on API key or quota errors
        if (
          err.message.includes('Quota') ||
          err.message.includes('Google API Key') ||
          err.message.includes('Forbidden')
        ) {
          throw err
        }
        if (attempt === 1) break
        await wait(1000)
      }
    }
  }

  throw new Error(lastError || 'AI सेवा से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।')
}

// Extracts fields from photos of documents (Aadhaar, land records, etc.)
// using Gemini's native image understanding - no separate OCR library needed.
export async function extractDocumentFields(images, schemeName, requiredDocs) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '' || GEMINI_API_KEY.includes('your_')) {
    throw new Error(
      'VITE_GEMINI_API_KEY is missing! Please configure VITE_GEMINI_API_KEY in your environment variables.'
    )
  }

  const docsText = Array.isArray(requiredDocs) ? requiredDocs.join(', ') : requiredDocs

  const promptText = `You are extracting information from photos of Indian government documents, to help pre-fill an application for the scheme "${schemeName}". The documents typically needed for this scheme are: ${docsText}.

Look carefully at the attached image(s) and extract any of these fields you can actually read: Full Name, Date of Birth, Gender, Aadhaar Number, Address, Father's or Husband's Name, Bank Account Number, IFSC Code, Bank Name, Land/Khasra/Khatauni Number, Village, District, State, Annual Income (if shown on a document), Category (SC/ST/OBC/General, if shown), Mobile Number.

Respond with ONLY a raw JSON object (no markdown, no code fences), exactly this shape:
{
  "extracted": { "Full Name": "value or null", "Date of Birth": "value or null", ... },
  "notes": "brief note on image quality or anything unclear, or null if nothing to flag"
}

CRITICAL: If a field is not clearly visible or not present in the image(s), use null for it - never guess, infer, or invent a value that isn't actually shown in the document.`

  const parts = [{ text: promptText }]
  for (const img of images) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  }

  const modelsToTry = discoveredModel
    ? [discoveredModel, ...KNOWN_MODELS.filter((m) => m !== discoveredModel)]
    : [...KNOWN_MODELS]
  let lastError = null

  for (const model of modelsToTry) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errText = await response.text()
        const detail = parseGoogleError(response.status, errText)
        if (response.status === 404) {
          lastError = `Model ${model} not found: ${detail}`
          continue
        }
        throw new Error(`Document extraction failed (${response.status}): ${detail}`)
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('No response from document extraction')

      try {
        return JSON.parse(text)
      } catch (e) {
        throw new Error('Could not read the extracted details - please try again with a clearer photo.')
      }
    } catch (err) {
      if (err.message.includes('Document extraction failed') || err.message.includes('Could not read')) {
        throw err
      }
      lastError = err.message
    }
  }

  throw new Error(lastError || 'Document extraction failed. Please try again with a clear photo.')
}
