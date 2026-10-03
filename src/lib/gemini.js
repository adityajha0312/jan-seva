const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Primary, fallback, and tertiary models supported across all Google AI Studio tiers
const PRIMARY_MODEL = 'gemini-1.5-flash'
const FALLBACK_MODEL = 'gemini-2.0-flash'
const TERTIARY_MODEL = 'gemini-1.5-pro'

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

  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
  }
  if (jsonMode) {
    body.generationConfig = { responseMimeType: 'application/json', temperature: 0.2 }
  }

  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL, TERTIARY_MODEL]
  let lastError = null

  for (const model of modelsToTry) {
    // Try v1beta first, fallback to v1 if 404
    const apiVersions = ['v1beta', 'v1']

    for (const apiVersion of apiVersions) {
      const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

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
            lastError = 'Rate limited'
            await wait(1500 * Math.pow(2, attempt) + Math.random() * 400)
            continue
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
              lastError = `Model ${model} (${apiVersion}) not found: ${detail}`
              break // try next version or next model
            }

            lastError = `Gemini API error (${response.status}): ${detail}`
            break
          }

          const data = await response.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (!text) {
            throw new Error('No response text received from Gemini')
          }
          return text
        } catch (err) {
          lastError = err.message
          // If it's a fatal API key error, propagate immediately
          if (err.message.includes('Google API Key') || err.message.includes('Forbidden')) {
            throw err
          }
          if (attempt === 1) break
          await wait(1000)
        }
      }
    }
  }

  if (lastError && lastError.toLowerCase().includes('rate')) {
    throw new Error('सर्वर पर अभी अधिक लोड है (Rate limit)। कृपया 5-10 सेकंड बाद पुनः प्रयास करें।')
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

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`

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
}
