import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'
import { startListening, speakText, stopSpeaking, isVoiceInputSupported, isVoiceOutputSupported } from './lib/speech'
import { subscribeToConnectionStatus, isCurrentlyOnline, getCacheAge, getSchemesFromCache, getSavedSchemeIds, toggleSavedScheme, clearSchemesCache, clearSavedSchemes } from './lib/offline'
import { getProfile, saveProfile, clearProfile, profileToOpener } from './lib/profile'
import { getSettings, saveSettings } from './lib/settings'
import Logo from './Logo'
import {
  MicIcon, StopIcon, SpeakerOnIcon, SpeakerOffIcon, MenuIcon, CloseIcon, PlusChatIcon,
  GridIcon, DocumentIcon, BookmarkIcon, UserCircleIcon, SettingsGearIcon, GlobeIcon,
  SendIcon, SearchIcon, ShieldAlertIcon, CalculatorIcon, BarChartIcon,
} from './Icons'
import ApplicationForm from './ApplicationForm'
import LandingPage from './LandingPage'
import GrievanceRedressal from './GrievanceRedressal'
import EligibilityScorecard from './EligibilityScorecard'
import AdminDashboard from './AdminDashboard'

// Voice input/output languages. Web Speech API support for Marathi and
// Tamil depends on the browser/OS having those voices installed, but the
// language codes themselves are standard BCP-47 tags it understands.
const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'ta-IN', label: 'தமிழ்' },
]

const QUICK_LINKS = [
  { label: 'PM-KISAN', url: 'https://pmkisan.gov.in' },
  { label: 'Ayushman Bharat', url: 'https://beneficiary.nha.gov.in' },
  { label: 'MP Scholarship Portal', url: 'https://hescholarship.mp.gov.in' },
  { label: 'MP Social Security', url: 'https://socialsecurity.mp.gov.in' },
  { label: 'PM Awas Yojana (Gramin)', url: 'https://pmayg.nic.in' },
  { label: 'National Scholarship Portal', url: 'https://scholarships.gov.in' },
  { label: 'Ujjwala Yojana', url: 'https://www.pmuy.gov.in' },
  { label: 'e-Shram (Unorganized Workers)', url: 'https://eshram.gov.in' },
  { label: 'Jan Dhan Yojana', url: 'https://www.pmjdy.gov.in' },
  { label: 'Common Service Centre', url: 'https://csc.gov.in' },
]

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>
  })
}

function MessageContent({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let currentList = []

  function flushList(key) {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {currentList.map((line, i) => (
            <li key={i} style={{ marginBottom: '3px' }}>
              {renderInline(line.replace(/^[*\-]\s+/, ''), `li-${key}-${i}`)}
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushList(idx)
      const level = headingMatch[1].length
      blocks.push(
        <div
          key={idx}
          style={{
            fontWeight: 700,
            color: 'var(--color-forest)',
            fontSize: level <= 2 ? '15.5px' : '14.5px',
            margin: '10px 0 4px',
          }}
        >
          {renderInline(headingMatch[2], `h-${idx}`)}
        </div>
      )
    } else if (/^[*\-]\s+/.test(trimmed) && !/^\*\*/.test(trimmed)) {
      currentList.push(trimmed)
    } else {
      flushList(idx)
      if (trimmed === '') {
        blocks.push(<div key={idx} style={{ height: '6px' }} />)
      } else if (trimmed === '--' || trimmed === '---' || trimmed === '***') {
        blocks.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(20,83,45,0.12)', margin: '8px 0' }} />)
      } else {
        blocks.push(<div key={idx}>{renderInline(line, `p-${idx}`)}</div>)
      }
    }
  })
  flushList('end')

  return <>{blocks}</>
}

const CATEGORY_KEYWORDS = {
  farmer: ['farmer', 'farming', 'kisan', 'agricultur', 'land', 'acre', 'hectare', 'crop', 'khet'],
  student: ['student', 'scholarship', 'school', 'college', 'class ', 'study', 'studying', 'graduate', 'education'],
  woman: ['woman', 'women', 'girl', 'daughter', 'wife', 'mother', 'pregnan', 'widow', 'ladli'],
  senior: ['senior', 'old age', 'elderly', '60 year', '65 year', '70 year', 'retire'],
  disability: ['disab', 'divyang', 'handicap'],
  youth: ['unemployed', 'youth', 'jobless', 'no job', 'looking for work', 'fresher', 'unemploy'],
  general: ['bpl', 'poor', 'ration card', 'below poverty', 'house', 'housing', 'lpg', 'gas connection', 'hospital', 'health insurance'],
}

function guessRelevantCategories(conversationText) {
  const lower = conversationText.toLowerCase()
  const matched = new Set(['general'])
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.add(category)
    }
  }
  return matched
}

function buildSystemInstruction(schemes, conversationText) {
  const relevantCategories = guessRelevantCategories(conversationText)
  const likelyRelevant = schemes.filter((s) => relevantCategories.has(s.category))
  const others = schemes.filter((s) => !relevantCategories.has(s.category))

  const formatScheme = (s) => `
- ${s.scheme_name} (${s.scheme_name_hindi || ''}) [${s.category}, ${s.level}]
  Eligibility: ${JSON.stringify(s.eligibility_criteria)}
  Benefits: ${s.benefits}
  Documents: ${JSON.stringify(s.documents_required)}
  How to apply: ${s.how_to_apply}`

  return `You are Jan Seva (जन सेवा), an advanced AI Citizen Welfare & Governance Assistant for citizens of Madhya Pradesh and India.

LIKELY RELEVANT SCHEMES based on the conversation so far - check these carefully first, they are probably what this person needs:
${likelyRelevant.map(formatScheme).join('\n')}

OTHER SCHEMES in the database (less likely to apply here, but check if the person's situation shifts):
${others.map(formatScheme).join('\n')}

HOW TO RESPOND:
1. If you don't yet have enough details to check eligibility, ask 1-2 short friendly clarifying questions (occupation, age, land, income, gender, etc.).
2. Once you have enough details, recommend the schemes above that clearly match - explain briefly why they qualify, the benefit amount, documents needed, and how to apply, all taken from the details given above. Be confident, not hesitant - a farmer with small landholding, for example, normally qualifies for multiple schemes on this list at once.
3. You may also mention a real Indian government scheme you know about that is NOT in the list above, if it genuinely seems relevant - but you MUST clearly label it as unverified, for example: "Note: [Scheme Name] is not in my verified database, so please confirm the current details with an official source before relying on it." Never state facts about an unlisted scheme (amounts, eligibility, documents) with the same confidence as a listed one - always flag it as unverified information, separate from your verified recommendations.
4. Only say "I don't have a verified scheme for your situation" if you've genuinely checked the list and nothing fits - not by default. If you know of an unverified scheme per rule 3, mention it there instead; otherwise suggest the National Scholarship Portal, nearest Common Service Centre (CSC), or relevant district office.
5. Say "Namaste" only in your first reply. Keep replies concise, warm, and easy to read on a phone. Bold only scheme names and key numbers. Match the user's language and script exactly - English, Hindi, Marathi, Tamil, Hinglish, or any other Indian language they use - rather than defaulting to English.
6. Stay strictly in scope: you only help with Indian government schemes and the person's eligibility for them. If asked something unrelated (celebrities, general trivia, coding help, other countries, etc.), do NOT answer it - politely say that's outside what you help with, briefly state your actual purpose, and ask if they'd like help finding a scheme instead. Never answer the off-topic question itself, even partially.`
}

const UI_TEXT = {
  'en-IN': {
    welcome: "Namaste! I am Jan Seva (जन सेवा). Tell me a bit about yourself — your occupation, age, or situation — and I'll help you find government schemes and benefits you qualify for.",
    online: 'Online',
    offline: 'Offline',
    placeholderIdle: "Ask Jan Seva... (e.g. 'I am a farmer with 2 acres of land in MP')",
    placeholderOffline: 'Reconnect to internet to keep chatting...',
    placeholderListening: 'Listening... speak now',
  },
  'hi-IN': {
    welcome: 'नमस्ते! मैं जन सेवा (Jan Seva) हूँ। मुझे अपने बारे में थोड़ा बताएं — आपका व्यवसाय, उम्र, या स्थिति — और मैं आपको उन सरकारी योजनाओं को खोजने में मदद करूंगा जिनके लिए आप पात्र हैं।',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    placeholderIdle: "जन सेवा से पूछें... (उदा: 'मैं 2 एकड़ जमीन वाला किसान हूं')",
    placeholderOffline: 'बातचीत जारी रखने के लिए इंटरनेट से दोबारा जुड़ें...',
    placeholderListening: 'सुन रहा हूं... अब बोलें',
  },
  'mr-IN': {
    welcome: 'नमस्कार! मी जन सेवा (Jan Seva) आहे. मला तुमच्याबद्दल थोडं सांगा — तुमचा व्यवसाय, वय किंवा परिस्थिती — आणि मी तुम्हाला पात्र असलेल्या सरकारी योजना शोधण्यात मदत करेन.',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    placeholderIdle: "जन सेवेला विचारा... (उदा: 'मी 2 एकर जमीन असलेला शेतकरी आहे')",
    placeholderOffline: 'गप्पा सुरू ठेवण्यासाठी इंटरनेटशी पुन्हा कनेक्ट करा...',
    placeholderListening: 'ऐकत आहे... आता बोला',
  },
  'ta-IN': {
    welcome: 'வணக்கம்! நான் ஜன் சேவா (Jan Seva). உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள் — உங்கள் தொழில், வயது அல்லது சூழ்நிலை — நீங்கள் தகுதி பெறக்கூடிய அரசு திட்டங்களைக் கண்டறிய நான் உதவுகிறேன்.',
    online: 'ஆன்லைன்',
    offline: 'ஆஃப்லைன்',
    placeholderIdle: "ஜன் சேவாவிடம் கேளுங்கள்...",
    placeholderOffline: 'உரையாடலைத் தொடர இணையத்துடன் மீண்டும் இணையவும்...',
    placeholderListening: 'கேட்கிறேன்... இப்போது பேசுங்கள்',
  },
}

function t(lang, key) {
  return (UI_TEXT[lang] && UI_TEXT[lang][key]) || UI_TEXT['en-IN'][key]
}

function Welcome(lang) {
  return {
    role: 'assistant',
    text: t(lang, 'welcome'),
  }
}

function FormattedField({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--color-charcoal-soft)' }}>Not specified</span>
  }
  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {value.map((item, i) => (
          <li key={i} style={{ marginBottom: '2px' }}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    return (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {Object.entries(value).map(([key, val]) => (
          <li key={key} style={{ marginBottom: '2px' }}>
            <strong>{key.replace(/_/g, ' ')}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
          </li>
        ))}
      </ul>
    )
  }
  return <span>{String(value)}</span>
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [pendingOpener, setPendingOpener] = useState(null)
  const [schemes, setSchemes] = useState(() => getSchemesFromCache() || [])
  const [messages, setMessages] = useState(() => [Welcome(getSettings().defaultVoiceLang)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [error, setError] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [showBrowseSchemes, setShowBrowseSchemes] = useState(false)
  const [schemeSearch, setSchemeSearch] = useState('')
  const [viewingScheme, setViewingScheme] = useState(null)
  const [savedSchemeIds, setSavedSchemeIds] = useState(() => getSavedSchemeIds())
  const [showSavedSchemes, setShowSavedSchemes] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [settings, setSettings] = useState(() => getSettings())
  const [voiceLang, setVoiceLang] = useState(() => getSettings().defaultVoiceLang)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const listenControllerRef = useRef(null)
  const [isOnline, setIsOnline] = useState(isCurrentlyOnline())
  const [usingCachedSchemes, setUsingCachedSchemes] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState(() => getProfile())
  const [profileForm, setProfileForm] = useState(() => getProfile() || { name: '', age: '', occupation: '', location: '' })
  const [showSettings, setShowSettings] = useState(false)
  const [showScorecard, setShowScorecard] = useState(false)
  const [showGrievance, setShowGrievance] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [applySchemeId, setApplySchemeId] = useState(null)
  const bottomRef = useRef(null)

  function showToast(message) {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }

  function handleStart(opener) {
    setStarted(true)
    if (opener) setPendingOpener(opener)
  }

  useEffect(() => {
    fetchAllSchemes().then(({ schemes, fromCache }) => {
      if (schemes.length === 0) {
        setTimeout(() => {
          fetchAllSchemes().then((retryResult) => {
            setSchemes(retryResult.schemes)
            setUsingCachedSchemes(retryResult.fromCache)
            setLoadingSchemes(false)
          })
        }, 2000)
      } else {
        setSchemes(schemes)
        setUsingCachedSchemes(fromCache)
        setLoadingSchemes(false)
      }
    })
  }, [])

  function retryLoadSchemes() {
    fetchAllSchemes().then(({ schemes, fromCache }) => {
      setSchemes(schemes)
      setUsingCachedSchemes(fromCache)
      setLoadingSchemes(false)
    })
  }

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((online) => {
      setIsOnline(online)
      if (online) {
        fetchAllSchemes().then(({ schemes, fromCache }) => {
          setSchemes(schemes)
          setUsingCachedSchemes(fromCache)
        })
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isOnline])

  useEffect(() => {
    if (!showLangMenu) return
    function handleClickOutside() {
      setShowLangMenu(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showLangMenu])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [Welcome(voiceLang)]
      }
      return prev
    })
  }, [voiceLang])

  useEffect(() => {
    if (started && pendingOpener && !loadingSchemes) {
      const opener = pendingOpener
      setPendingOpener(null)
      handleSend(opener)
    }
  }, [started, pendingOpener, loadingSchemes])

  function handleToggleSave(schemeId) {
    const next = toggleSavedScheme(schemeId)
    setSavedSchemeIds(next)
    showToast(next.includes(schemeId) ? 'Scheme saved' : 'Scheme removed')
  }

  function handleClearSaved() {
    clearSavedSchemes()
    setSavedSchemeIds([])
    showToast('Saved schemes cleared')
  }

  async function handleSend(explicitText) {
    const textToSend = (explicitText !== undefined ? explicitText : input).trim()
    if (!textToSend || loading) return

    if (isListening && listenControllerRef.current) {
      listenControllerRef.current.stop()
      listenControllerRef.current = null
      setIsListening(false)
    }

    const userMessage = { role: 'user', text: textToSend }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const conversationText = newMessages.map((m) => m.text).join(' ')
      const systemInstruction = buildSystemInstruction(schemes, conversationText)
      const replyText = await askGemini(systemInstruction, newMessages)
      setMessages([...newMessages, { role: 'assistant', text: replyText }])
      if (speakEnabled) {
        speakText(replyText, voiceLang)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClearChat() {
    setMessages([Welcome(voiceLang)])
    setError(null)
    setShowLinks(false)
    setIsMobileNavOpen(false)
    stopSpeaking()
  }

  function handleSaveProfile() {
    saveProfile(profileForm)
    setProfile(profileForm)
    showToast('Profile saved')
    setShowProfile(false)
  }

  function handleClearProfile() {
    clearProfile()
    setProfile(null)
    setProfileForm({ name: '', age: '', occupation: '', location: '' })
    showToast('Profile cleared')
  }

  function handleUseProfileInChat() {
    const opener = profileToOpener(profile)
    setShowProfile(false)
    if (opener) handleSend(opener)
  }

  function handleChangeSetting(key, value) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
    if (key === 'defaultVoiceLang') setVoiceLang(value)
  }

  function handleClearCache() {
    clearSchemesCache()
    showToast('Offline scheme cache cleared')
  }

  function handleMicClick() {
    if (isListening) {
      if (listenControllerRef.current) {
        listenControllerRef.current.stop()
        listenControllerRef.current = null
      }
      setIsListening(false)
      return
    }

    if (speakEnabled) {
      stopSpeaking()
    }

    listenControllerRef.current = startListening({
      lang: voiceLang,
      onResult: (transcript) => {
        setIsListening(false)
        listenControllerRef.current = null
        if (transcript && transcript.trim()) {
          handleSend(transcript.trim())
        }
      },
      onError: (err) => {
        setIsListening(false)
        listenControllerRef.current = null
        if (err !== 'no-speech') {
          setError(`Voice input error: ${err}`)
        }
      },
    })
    setIsListening(true)
  }

  useEffect(() => {
    return () => stopSpeaking()
  }, [])

  if (!started) {
    return (
      <>
        <LandingPage
          onStart={handleStart}
          onOpenScorecard={() => setShowScorecard(true)}
          onOpenGrievance={() => setShowGrievance(true)}
          onOpenAdmin={() => setShowAdminDashboard(true)}
        />
        {showScorecard && (
          <EligibilityScorecard
            defaultProfile={profile}
            onClose={() => setShowScorecard(false)}
            onSelectSchemeToApply={(scheme) => {
              setApplySchemeId(scheme.id)
              setStarted(true)
              setShowApplyForm(true)
            }}
          />
        )}
        {showGrievance && (
          <GrievanceRedressal
            defaultProfile={profile}
            onClose={() => setShowGrievance(false)}
          />
        )}
        {showAdminDashboard && (
          <AdminDashboard
            onClose={() => setShowAdminDashboard(false)}
          />
        )}
      </>
    )
  }

  const filteredSchemes = schemes.filter((s) =>
    s.scheme_name.toLowerCase().includes(schemeSearch.toLowerCase())
  )
  const popularSchemes = schemes.slice(0, 5)
  const savedSchemesList = schemes.filter((s) => savedSchemeIds.includes(s.id))

  return (
    <div className={`ym-shell${settings.textSize === 'large' ? ' ym-text-large' : ''}`}>
      {isMobileNavOpen && <div className="ym-shell-scrim" onClick={() => setIsMobileNavOpen(false)} />}

      {/* Left sidebar: brand + primary navigation */}
      <aside className={`ym-shell-left${isMobileNavOpen ? ' ym-open' : ''}`} style={styles.sidebarLeft}>
        <div style={styles.sidebarBrand}>
          <Logo size={28} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.sidebarBrandTitle}>Jan Seva (जन सेवा)</div>
            <div style={styles.sidebarBrandSub}>AI Citizen Governance</div>
          </div>
          <button className="ym-mobile-close-btn" style={styles.mobileCloseBtn} onClick={() => setIsMobileNavOpen(false)} aria-label="Close menu">
            <CloseIcon size={16} color="#0f172a" />
          </button>
        </div>

        <button className="ym-nav-item ym-nav-primary" onClick={handleClearChat} style={{ margin: '2px 0 4px' }}>
          <PlusChatIcon size={15} color="#ffffff" /> New Chat
        </button>

        <div style={styles.sidebarSectionLabel}>Browse</div>
        <button className="ym-nav-item" onClick={() => { setShowBrowseSchemes(true); setIsMobileNavOpen(false) }}>
          <GridIcon size={15} color="#059669" /> Schemes
        </button>
        <button className="ym-nav-item" onClick={() => { setShowScorecard(true); setIsMobileNavOpen(false) }}>
          <CalculatorIcon size={15} color="#059669" /> Eligibility Scorecard
        </button>
        <button className="ym-nav-item" onClick={() => { setShowGrievance(true); setIsMobileNavOpen(false) }}>
          <ShieldAlertIcon size={15} color="#e11d48" /> CM Helpline 181
        </button>
        <button className="ym-nav-item" onClick={() => { setShowApplyForm(true); setIsMobileNavOpen(false) }}>
          <DocumentIcon size={15} color="#0284c7" /> Applications & Forms
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSavedSchemes(true); setIsMobileNavOpen(false) }}>
          <BookmarkIcon size={15} color="#f59e0b" /> Saved Schemes
        </button>

        <div style={styles.sidebarSectionLabel}>Governance & Account</div>
        <button className="ym-nav-item" onClick={() => { setShowAdminDashboard(true); setIsMobileNavOpen(false) }}>
          <BarChartIcon size={15} color="#7c3aed" /> GovTech Portal
        </button>
        <button className="ym-nav-item" onClick={() => { setProfileForm(profile || { name: '', age: '', occupation: '', location: '' }); setShowProfile(true); setIsMobileNavOpen(false) }}>
          <UserCircleIcon size={15} color="#059669" /> Citizen Profile
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSettings(true); setIsMobileNavOpen(false) }}>
          <SettingsGearIcon size={15} color="#475569" /> Settings
        </button>
        <button className="ym-nav-item" onClick={() => { setShowLinks((s) => !s); setIsMobileNavOpen(false) }}>
          <GlobeIcon size={15} color="#0284c7" /> Official Portals
        </button>

        <div style={styles.sidebarHelp}>
          <div style={styles.sidebarHelpRow}>
            <div style={styles.sidebarHelpAvatar}><Logo size={18} /></div>
            <div>
              <div style={styles.sidebarHelpTitle}>Voice Assistant</div>
              <div style={styles.sidebarHelpText}>Speak in your mother tongue</div>
            </div>
          </div>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-nav-item'}
              style={styles.sidebarVoiceBtn}
              onClick={() => { handleMicClick(); setIsMobileNavOpen(false) }}
              disabled={loadingSchemes || !isOnline}
            >
              <MicIcon size={14} color={isListening ? 'white' : '#ffffff'} /> {isListening ? 'Listening...' : 'Try Voice'}
            </button>
          )}
        </div>
      </aside>

      {/* Main chat column */}
      <div style={styles.mainCol}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button className="ym-mobile-menu-btn" style={styles.mobileMenuBtn} onClick={() => setIsMobileNavOpen(true)} aria-label="Open menu">
              <MenuIcon size={19} color="#0f172a" />
            </button>
            <div>
              <h1 className="ym-title-text" style={styles.title}>Jan Seva (जन सेवा)</h1>
              <p className="ym-subtitle-text" style={styles.subtitle}>
                <span style={{ ...styles.statusDot, background: isOnline ? '#10b981' : '#f59e0b' }} />
                {isOnline ? t(voiceLang, 'online') : t(voiceLang, 'offline')}
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              className="ym-icon-btn ym-header-desktop-only"
              onClick={() => setShowScorecard(true)}
              title="Citizen Eligibility Scorecard"
            >
              <CalculatorIcon size={14} color="#059669" /> Scorecard
            </button>
            <button
              className="ym-icon-btn ym-header-desktop-only"
              onClick={() => setShowGrievance(true)}
              title="CM Helpline 181 Grievance"
            >
              <ShieldAlertIcon size={14} color="#e11d48" /> 181 Helpline
            </button>
            <button
              className="ym-icon-btn ym-header-desktop-only"
              onClick={() => setShowAdminDashboard(true)}
              title="GovTech Intelligence & Admin Portal"
            >
              <BarChartIcon size={14} color="#7c3aed" /> GovTech
            </button>
            {isVoiceInputSupported && (
              <div style={styles.langMenuWrap} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="ym-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowLangMenu((s) => !s)
                  }}
                  title="Voice input/output language"
                >
                  <GlobeIcon size={14} color="#0284c7" /> {VOICE_LANGUAGES.find((l) => l.code === voiceLang)?.label}
                </button>
                {showLangMenu && (
                  <div style={styles.langMenuDropdown}>
                    {VOICE_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        style={{
                          ...styles.langMenuItem,
                          ...(l.code === voiceLang ? styles.langMenuItemActive : {}),
                        }}
                        onClick={() => { setVoiceLang(l.code); setShowLangMenu(false) }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isVoiceOutputSupported && (
              <button
                className="ym-icon-btn"
                onClick={() => {
                  if (speakEnabled) stopSpeaking()
                  setSpeakEnabled((s) => !s)
                }}
                title="Read replies aloud"
              >
                {speakEnabled ? <SpeakerOnIcon size={15} color="#059669" /> : <SpeakerOffIcon size={15} color="#64748b" />}
                {speakEnabled ? ' On' : ' Off'}
              </button>
            )}
          </div>
        </header>

        {!isOnline && (
          <div style={styles.offlineBanner}>
            You're offline — chat needs internet to think through scheme matches. Browse the saved scheme list below, or reconnect to keep chatting.
            {usingCachedSchemes && ` (Showing scheme data saved from your last connection.)`}
          </div>
        )}

        {showLinks && (
          <div style={styles.linksBar}>
            {QUICK_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ym-link-pill"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Message scroll container */}
        <div style={styles.chatArea}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className="ym-bubble"
              style={{
                ...styles.bubble,
                ...(m.role === 'user' ? styles.userBubble : styles.assistantBubble),
              }}
            >
              <MessageContent text={m.text} />
            </div>
          ))}
          {loading && (
            <div
              className="ym-bubble"
              style={{ ...styles.bubble, ...styles.assistantBubble }}
            >
              <div className="ym-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          {error && <div style={styles.errorNote}>{error}</div>}
          <div ref={bottomRef} />
        </div>

        {/* Text and Voice Input */}
        <div style={styles.inputArea}>
          <input
            style={styles.textInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isOnline
                ? t(voiceLang, 'placeholderOffline')
                : isListening
                ? t(voiceLang, 'placeholderListening')
                : t(voiceLang, 'placeholderIdle')
            }
            disabled={loading || !isOnline}
          />
          {isVoiceInputSupported && (
            <button
              className={`ym-mic-btn${isListening ? ' ym-mic-active' : ''}`}
              onClick={handleMicClick}
              disabled={loading || !isOnline}
              title={isListening ? 'Stop listening' : 'Speak your question'}
            >
              {isListening ? <StopIcon size={18} color="white" /> : <MicIcon size={18} />}
            </button>
          )}
          <button
            className="ym-send-btn"
            style={styles.sendButton}
            onClick={() => handleSend()}
            disabled={loading || !isOnline || !input.trim()}
            title="Send message"
          >
            <SendIcon size={17} color="#ffffff" />
          </button>
        </div>
      </div>

      {/* Right sidebar: quick schemes + promo */}
      <aside className="ym-shell-right" style={styles.sidebarRight}>
        <div style={styles.rightCard}>
          <div style={styles.rightCardHeader}>
            <span>Popular MP Schemes</span>
            <button style={styles.viewAllBtn} onClick={() => setShowBrowseSchemes(true)}>View all</button>
          </div>
          <div>
            {popularSchemes.map((s) => (
              <button
                key={s.id}
                className="ym-scheme-row"
                onClick={() => setViewingScheme(s)}
              >
                <div style={styles.schemeRowDot} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={styles.schemeRowName}>{s.scheme_name}</span>
                  <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.promoCard}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>MPOnline Hackathon 2026</div>
          <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: 1.45 }}>
            Jan Seva (जन सेवा) addresses Challenge 5 with multi-lingual voice intelligence, offline access, and 1-click citizen applications.
          </div>
        </div>
      </aside>

      {/* Modals */}
      {showBrowseSchemes && (
        <div style={styles.overlay} onClick={() => setShowBrowseSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>All Government Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowBrowseSchemes(false)}><CloseIcon size={20} /></button>
            </div>
            <div style={styles.browseSearchRow}>
              <SearchIcon size={16} color="var(--color-charcoal-soft)" />
              <input
                style={styles.browseSearchInput}
                placeholder="Search schemes by name..."
                value={schemeSearch}
                onChange={(e) => setSchemeSearch(e.target.value)}
              />
            </div>
            <div style={styles.browseList}>
              {filteredSchemes.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="ym-scheme-row"
                    style={{ ...styles.browseRow, flex: 1 }}
                    onClick={() => { setViewingScheme(s); setShowBrowseSchemes(false) }}
                  >
                    <div>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                      {s.benefits && <span style={styles.browseRowBenefit}>{s.benefits}</span>}
                    </div>
                  </button>
                  <button
                    style={styles.saveIconBtn}
                    onClick={() => handleToggleSave(s.id)}
                    title={savedSchemeIds.includes(s.id) ? 'Remove from saved' : 'Save scheme'}
                  >
                    <BookmarkIcon size={18} color={savedSchemeIds.includes(s.id) ? 'var(--color-marigold-dark)' : 'var(--color-charcoal-soft)'} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSavedSchemes && (
        <div style={styles.overlay} onClick={() => setShowSavedSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Saved Schemes ({savedSchemesList.length})</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSavedSchemes(false)}><CloseIcon size={20} /></button>
            </div>
            <div style={styles.browseList}>
              {savedSchemesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-charcoal-soft)' }}>
                  No schemes saved yet. Use the bookmark icon on any scheme to save it for quick offline viewing.
                </div>
              ) : (
                savedSchemesList.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="ym-scheme-row"
                      style={{ ...styles.browseRow, flex: 1 }}
                      onClick={() => { setViewingScheme(s); setShowSavedSchemes(false) }}
                    >
                      <div>
                        <span style={styles.schemeRowName}>{s.scheme_name}</span>
                        <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                      </div>
                    </button>
                    <button
                      style={styles.saveIconBtn}
                      onClick={() => handleToggleSave(s.id)}
                      title="Remove from saved"
                    >
                      <BookmarkIcon size={18} color="var(--color-marigold-dark)" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewingScheme && (
        <div style={styles.overlay} onClick={() => setViewingScheme(null)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>{viewingScheme.scheme_name}</h2>
              <button style={styles.browseCloseBtn} onClick={() => setViewingScheme(null)}><CloseIcon size={20} /></button>
            </div>
            <div style={styles.detailBody}>
              <div style={styles.detailMeta}>{viewingScheme.category} · {viewingScheme.level} level</div>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Benefits</div>
                <div style={styles.detailParagraph}>{viewingScheme.benefits || 'No specific benefit description available.'}</div>
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Eligibility Criteria</div>
                <FormattedField value={viewingScheme.eligibility_criteria} />
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Required Documents</div>
                <FormattedField value={viewingScheme.documents_required} />
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>How to Apply</div>
                <div style={styles.detailParagraph}>{viewingScheme.how_to_apply || 'Follow official state portal instructions.'}</div>
              </div>
              <button
                style={styles.detailAskBtn}
                onClick={() => {
                  const s = viewingScheme
                  setViewingScheme(null)
                  handleSend(`Tell me more about ${s.scheme_name} and whether I might qualify.`)
                }}
              >
                Ask Jan Seva about this scheme
              </button>
            </div>
          </div>
        </div>
      )}

      {showApplyForm && (
        <ApplicationForm
          schemes={schemes}
          preselectedSchemeId={applySchemeId}
          onClose={() => {
            setShowApplyForm(false)
            setApplySchemeId(null)
          }}
        />
      )}

      {showScorecard && (
        <EligibilityScorecard
          defaultProfile={profile}
          onClose={() => setShowScorecard(false)}
          onSelectSchemeToApply={(scheme) => {
            setApplySchemeId(scheme.id)
            setShowApplyForm(true)
          }}
        />
      )}

      {showGrievance && (
        <GrievanceRedressal
          defaultProfile={profile}
          onClose={() => setShowGrievance(false)}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
        />
      )}

      {showProfile && (
        <div style={styles.overlay} onClick={() => setShowProfile(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Citizen Profile</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowProfile(false)}><CloseIcon size={20} /></button>
            </div>
            <div style={{ padding: '6px 0' }}>
              <label style={styles.formLabel}>
                Full Name
                <input
                  style={styles.formInput}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                />
              </label>
              <label style={styles.formLabel}>
                Age
                <input
                  style={styles.formInput}
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  placeholder="e.g. 42"
                />
              </label>
              <label style={styles.formLabel}>
                Occupation
                <input
                  style={styles.formInput}
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                  placeholder="e.g. Small Farmer, Student, Homemaker"
                />
              </label>
              <label style={styles.formLabel}>
                District / Location in MP
                <input
                  style={styles.formInput}
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g. Sehore, Bhopal, Ujjain"
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button style={{ ...styles.detailAskBtn, marginTop: 0, flex: 1 }} onClick={handleSaveProfile}>Save Profile</button>
                {profile && (
                  <button style={styles.formSecondaryBtn} onClick={handleClearProfile}>Clear</button>
                )}
              </div>
              {profile && (
                <button style={styles.formLinkBtn} onClick={handleUseProfileInChat}>Start chat using this profile</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={styles.overlay} onClick={() => setShowSettings(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Settings</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSettings(false)}><CloseIcon size={20} /></button>
            </div>
            <div style={{ padding: '6px 0' }}>
              <div style={styles.formLabel}>
                Default Language
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {VOICE_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      style={{
                        ...styles.formToggleBtn,
                        ...(settings.defaultVoiceLang === l.code ? styles.formToggleBtnActive : {}),
                      }}
                      onClick={() => handleChangeSetting('defaultVoiceLang', l.code)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ ...styles.formLabel, marginTop: '16px' }}>
                Text Size
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {['normal', 'large'].map((size) => (
                    <button
                      key={size}
                      style={{
                        ...styles.formToggleBtn,
                        ...(settings.textSize === size ? styles.formToggleBtnActive : {}),
                      }}
                      onClick={() => handleChangeSetting('textSize', size)}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={styles.detailSectionTitle}>Storage & Cache</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button style={styles.formSecondaryBtn} onClick={handleClearCache}>Clear offline cache</button>
                  <button style={styles.formSecondaryBtn} onClick={handleClearSaved}>Clear saved schemes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ym-toast">{toast}</div>}
    </div>
  )
}

const styles = {
  sidebarLeft: {
    background: '#f0fdf4',
    borderRight: '1px solid #bbf7d0',
    color: '#0f172a',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    paddingBottom: '6px',
    borderBottom: '1px solid #dcfce7',
    position: 'relative',
  },
  sidebarBrandTitle: { fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' },
  sidebarBrandSub: { fontSize: '10px', color: '#059669', fontWeight: 700, marginTop: '1px', whiteSpace: 'nowrap' },
  mobileCloseBtn: {
    display: 'none', marginLeft: 'auto', background: '#dcfce7', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer',
  },
  sidebarSectionLabel: {
    fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800,
    color: '#047857', margin: '5px 6px 2px',
  },
  sidebarHelp: {
    marginTop: 'auto', background: '#ffffff', borderRadius: '10px',
    padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px',
    border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.06)',
  },
  sidebarHelpRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  sidebarHelpAvatar: { width: '24px', height: '24px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarHelpTitle: { fontSize: '12px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 },
  sidebarHelpText: { fontSize: '10.5px', color: '#64748b', lineHeight: 1.2 },
  sidebarVoiceBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', borderRadius: '8px',
    padding: '6px 10px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff',
    fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    background: '#f8fafc',
  },
  mobileMenuBtn: {
    display: 'none', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '7px', cursor: 'pointer', padding: '5px 7px', marginRight: '4px',
  },
  statusDot: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', marginRight: '4px' },
  header: {
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(12px)',
    color: '#0f172a',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'nowrap',
    borderBottom: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
    position: 'relative',
    zIndex: 100,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    overflow: 'hidden',
  },
  title: { margin: 0, fontSize: '15.5px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  subtitle: { margin: 0, fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', fontWeight: 500, whiteSpace: 'nowrap' },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    overflow: 'visible',
    position: 'relative',
  },
  langMenuWrap: {
    position: 'relative',
    zIndex: 110,
  },
  langMenuDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.22)',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '140px',
    zIndex: 99999,
    border: '1.5px solid #cbd5e1',
  },
  langMenuItem: {
    textAlign: 'left', padding: '8px 10px', borderRadius: '7px', border: 'none',
    background: 'transparent', color: '#1e293b', fontSize: '13.5px',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  langMenuItemActive: { background: '#ecfdf5', color: '#059669', fontWeight: 700 },
  sidebarRight: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' },
  rightCard: { background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  rightCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', fontWeight: 800,
    color: '#0f172a', marginBottom: '8px', padding: '2px 4px',
  },
  viewAllBtn: { background: 'transparent', border: 'none', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  schemeRowDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#059669', marginTop: '6px', flexShrink: 0 },
  schemeRowName: { display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 },
  schemeRowCategory: { display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'capitalize', marginTop: '2px' },
  promoCard: {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 70,
  },
  browseModal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '18px', maxWidth: '480px', width: '100%',
    maxHeight: '82vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
  },
  browseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  browseTitle: { margin: 0, fontSize: '18px', color: 'var(--color-forest)', fontWeight: 700 },
  browseCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal-soft)' },
  saveIconBtn: {
    background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', padding: '4px',
  },
  detailModal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '18px', maxWidth: '520px', width: '100%',
    maxHeight: '86vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
  },
  detailBody: { overflowY: 'auto', paddingRight: '4px' },
  detailOfflineNote: {
    background: '#f5e6c8', color: '#6b4d0f', fontSize: '12.5px', padding: '9px 12px',
    borderRadius: '10px', marginBottom: '12px', lineHeight: 1.45,
  },
  detailMeta: { fontSize: '12.5px', color: 'var(--color-charcoal-soft)', textTransform: 'capitalize', marginBottom: '8px' },
  detailParagraph: { fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 14px' },
  detailSection: { marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.5 },
  detailSectionTitle: { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '3px' },
  detailAskBtn: {
    marginTop: '10px', width: '100%', textAlign: 'center', padding: '12px', borderRadius: '12px',
    border: 'none', background: 'var(--color-forest)', color: 'var(--color-cream)', fontSize: '14px',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  formLabel: {
    display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', fontWeight: 700,
    color: 'var(--color-forest)', marginBottom: '12px',
  },
  formInput: {
    fontFamily: 'inherit', fontSize: '14px', fontWeight: 400, color: 'var(--color-charcoal)',
    padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(20,83,45,0.2)', background: '#fff',
  },
  formSecondaryBtn: {
    padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(20,83,45,0.25)', background: 'transparent',
    color: 'var(--color-forest)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  formLinkBtn: {
    marginTop: '10px', width: '100%', textAlign: 'center', background: 'none', border: 'none',
    color: 'var(--color-marigold-dark)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  formToggleBtn: {
    padding: '8px 14px', borderRadius: '999px', border: '1px solid rgba(20,83,45,0.2)', background: '#fff',
    color: 'var(--color-charcoal)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  },
  formToggleBtnActive: {
    background: 'var(--color-forest)', color: 'var(--color-cream)', borderColor: 'var(--color-forest)', fontWeight: 700,
  },
  browseSearchRow: {
    display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid rgba(20,83,45,0.2)',
    borderRadius: '10px', padding: '9px 12px', marginBottom: '10px',
  },
  browseSearchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '13.5px', fontFamily: 'inherit', background: 'transparent' },
  browseList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' },
  browseRow: { alignItems: 'flex-start', background: '#fff', marginBottom: '4px', border: '1px solid rgba(20,83,45,0.08)' },
  browseRowBenefit: { display: 'block', fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginTop: '3px', lineHeight: 1.4 },
  linksBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px 18px',
    background: 'var(--color-sage)',
    borderBottom: '1px solid rgba(20,83,45,0.1)',
  },
  offlineBanner: {
    background: '#f5e6c8',
    color: '#6b4d0f',
    fontSize: '13px',
    padding: '10px 18px',
    lineHeight: 1.5,
    borderBottom: '1px solid rgba(107,77,15,0.15)',
  },
  offlineSchemeList: {
    marginTop: '8px',
    border: '1px solid rgba(20,83,45,0.15)',
    borderRadius: '12px',
    padding: '12px 14px',
    background: '#ffffff',
  },
  offlineListTitle: {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-forest)',
  },
  offlineSchemeItem: {
    display: 'block',
    width: '100%',
    padding: '8px 0',
    borderTop: '1px solid rgba(20,83,45,0.08)',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    lineHeight: 1.45,
    color: 'inherit',
  },
  offlineSchemeCategory: {
    fontSize: '11.5px',
    color: 'var(--color-charcoal-soft)',
    textTransform: 'capitalize',
    margin: '2px 0 4px',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px clamp(8px, 2.5vw, 18px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: 0,
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-y',
    overscrollBehaviorY: 'contain',
  },
  bubble: {
    padding: '11px 14px',
    borderRadius: '16px',
    maxWidth: '88%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.5,
    fontSize: '14.5px',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
  },
  assistantBubble: {
    background: '#ffffff',
    color: '#0f172a',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  },
  systemNote: {
    fontSize: '13px',
    color: 'var(--color-charcoal-soft)',
    textAlign: 'center',
    padding: '6px',
  },
  errorNote: {
    fontSize: '13px',
    color: '#b00020',
    textAlign: 'center',
    padding: '6px',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
    borderTop: '1px solid #e2e8f0',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    resize: 'none',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.4,
    height: '40px',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
  },
}
