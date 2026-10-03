const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Standard models in Google AI Studio
const PRIMARY_MODEL = 'gemini-2.0-flash'
const FALLBACK_MODEL = 'gemini-1.5-flash'
const TERTIARY_MODEL = 'gemini-1.5-flash-8b'

// Waits `ms` milliseconds before continuing.
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Calls the Gemini API with automatic retry and exponential backoff on HTTP 429.
export async function askGemini(systemInstruction, conversationHistory, jsonMode = false) {
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
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    // Support both header and query param authentication for maximum compatibility
    const apiUrl = GEMINI_API_KEY ? `${baseUrl}?key=${encodeURIComponent(GEMINI_API_KEY)}` : baseUrl

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(GEMINI_API_KEY ? { 'x-goog-api-key': GEMINI_API_KEY } : {}),
          },
          body: JSON.stringify(body),
        })

        if (response.status === 429) {
          // Rate limited on Google API - retry with exponential backoff + jitter
          lastError = 'Rate limited'
          await wait(1500 * Math.pow(2, attempt) + Math.random() * 400)
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          if (response.status === 404 || response.status === 400) {
            lastError = `Model ${model} unavailable (${response.status})`
            break // try fallback model
          }
          throw new Error(`Gemini API error (${response.status}): ${errText}`)
        }

        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          throw new Error('No response text received from Gemini')
        }
        return text
      } catch (err) {
        lastError = err.message
        if (attempt === 2) break
        await wait(1200 * Math.pow(2, attempt))
      }
    }
  }

  if (lastError && lastError.toLowerCase().includes('rate')) {
    throw new Error('सर्वर पर अभी अधिक लोड है (Rate limit)। कृपया 5-10 सेकंड बाद पुनः संदेश भेजें।')
  }

  throw new Error(lastError || 'AI सेवा से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।')
}

// Extracts fields from photos of documents (Aadhaar, land records, etc.)
// using Gemini's native image understanding - no separate OCR library needed.
export async function extractDocumentFields(images, schemeName, requiredDocs) {
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

  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent`
  const apiUrl = GEMINI_API_KEY ? `${baseUrl}?key=${encodeURIComponent(GEMINI_API_KEY)}` : baseUrl

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(GEMINI_API_KEY ? { 'x-goog-api-key': GEMINI_API_KEY } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Document extraction failed (${response.status}): ${errText}`)
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
