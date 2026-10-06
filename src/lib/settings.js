const SETTINGS_KEY = 'jan_seva_settings'

export const DEFAULT_SETTINGS = {
  textSize: 'normal', // 'normal' | 'large'
  defaultVoiceLang: 'hi-IN', // Defaults to Hindi for MP citizen governance
  customApiKey: '', // Optional user/judge override Google Gemini API key
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem('yojana_mitra_settings')
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Could not save settings locally:', e)
  }
}
