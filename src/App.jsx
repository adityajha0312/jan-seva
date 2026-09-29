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

// Voice input/output languages
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

  async function handleSend(overrideText) {
    const textToSend = (overrideText ?? input).trim()
    if (!textToSend || loading) return

    if (!isOnline) {
      setError("You're offline right now, so I can't think through scheme matches - that needs an internet connection. You can still browse the saved scheme list below. I'll be ready to chat again as soon as you're back online.")
      return
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
    stopSpeaking()
    if (listenControllerRef.current) {
      listenControllerRef.current.abort()
      listenControllerRef.current = null
      setIsListening(false)
    }
    setMessages([Welcome(voiceLang)])
    setError(null)
    setIsMobileNavOpen(false)
  }

  function openSchemeDetail(scheme) {
    setViewingScheme(scheme)
    setShowBrowseSchemes(false)
    setShowSavedSchemes(false)
  }

  function handleToggleSaved(scheme) {
    const nextSaved = toggleSavedScheme(scheme.id)
    setSavedSchemeIds(nextSaved)
    const isNowSaved = nextSaved.includes(scheme.id)
    showToast(isNowSaved ? 'Saved to your offline list' : 'Removed from saved schemes')
  }

  function handleClearCache() {
    clearSchemesCache()
    showToast('Offline cache cleared')
  }

  function handleClearSaved() {
    clearSavedSchemes()
    setSavedSchemeIds([])
    showToast('Saved schemes cleared')
  }

  function handleSaveProfile() {
    saveProfile(profileForm)
    setProfile(profileForm)
    setShowProfile(false)
    showToast('Profile saved')
  }

  function handleClearProfile() {
    clearProfile()
    setProfile(null)
    setProfileForm({ name: '', age: '', occupation: '', location: '' })
    showToast('Profile cleared')
  }

  function handleUseProfileInChat() {
    if (!profile) return
    const opener = profileToOpener(profile)
    setShowProfile(false)
    handleSend(opener)
  }

  function handleChangeSetting(key, val) {
    const next = saveSettings({ [key]: val })
    setSettings(next)
    if (key === 'defaultVoiceLang') {
      setVoiceLang(val)
    }
  }

  function handleAskAboutScheme(scheme) {
    setViewingScheme(null)
    const prompt = `Tell me more about ${scheme.scheme_name}. Am I eligible, and how do I apply?`
    handleSend(prompt)
  }

  function handleMicClick() {
    if (isListening) {
      if (listenControllerRef.current) {
        listenControllerRef.current.abort()
        listenControllerRef.current = null
      }
      setIsListening(false)
      return
    }

    if (!isVoiceInputSupported) {
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    stopSpeaking()
    setError(null)
    setIsListening(true)

    listenControllerRef.current = startListening({
      lang: voiceLang,
      onResult: (transcript) => {
        setIsListening(false)
        listenControllerRef.current = null
        if (transcript) {
          handleSend(transcript)
        }
      },
      onError: (err) => {
        setIsListening(false)
        listenControllerRef.current = null
        if (err !== 'no-speech' && err !== 'aborted') {
          setError(`Voice input error: ${err}`)
        }
      },
    })
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
                  className="ym-icon-btn"
                  onClick={() => setShowLangMenu((s) => !s)}
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

        <div style={styles.chatArea}>
          {loadingSchemes ? (
            <p style={styles.systemNote}>Loading scheme database...</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className="ym-bubble"
                style={{
                  ...styles.bubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                {msg.role === 'assistant' ? <MessageContent text={msg.text} /> : msg.text}
              </div>
            ))
          )}
          {loading && (
            <div style={{ ...styles.bubble, ...styles.assistantBubble }} className="ym-bubble">
              <span className="ym-typing">
                <span></span><span></span><span></span>
              </span>
            </div>
          )}
          {error && <div style={styles.errorNote}>⚠️ {error}</div>}

          {!isOnline && schemes.length > 0 && (
            <div style={styles.offlineSchemeList}>
              <p style={styles.offlineListTitle}>Saved schemes you can browse offline — tap one for eligibility & how to apply:</p>
              {schemes.map((s) => (
                <button key={s.id} className="ym-scheme-row" style={styles.offlineSchemeItem} onClick={() => openSchemeDetail(s)}>
                  <span style={{ display: 'block' }}>
                    <strong>{s.scheme_name}</strong>
                    <div style={styles.offlineSchemeCategory}>{s.category} · {s.level}</div>
                    <div>{s.description}</div>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-mic-btn'}
              onClick={handleMicClick}
              disabled={loadingSchemes || !isOnline}
              title={isListening ? 'Stop listening' : 'Speak your message'}
              type="button"
            >
              {isListening ? <StopIcon size={17} color="white" /> : <MicIcon size={18} />}
            </button>
          )}
          <textarea
            className="ym-chat-input"
            style={styles.textInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!isOnline ? t(voiceLang, 'placeholderOffline') : isListening ? t(voiceLang, 'placeholderListening') : t(voiceLang, 'placeholderIdle')}
            rows={1}
            disabled={loadingSchemes || !isOnline}
          />
          <button
            className="ym-send-btn"
            style={styles.sendButton}
            onClick={() => handleSend()}
            disabled={loading || loadingSchemes || !input.trim() || !isOnline}
            aria-label="Send"
          >
            <SendIcon size={16} color="#ffffff" />
          </button>
        </div>
      </div>

      {/* Right sidebar: popular schemes drawn from live data */}
      <aside className="ym-shell-right" style={styles.sidebarRight}>
        <div style={styles.rightCard}>
          <div style={styles.rightCardHeader}>
            <span>Popular Schemes</span>
            <button style={styles.viewAllBtn} onClick={() => setShowBrowseSchemes(true)}>View All</button>
          </div>
          {loadingSchemes ? (
            <p style={styles.systemNote}>Loading...</p>
          ) : popularSchemes.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)' }}>No schemes loaded yet.</p>
          ) : (
            popularSchemes.map((s) => (
              <button key={s.id} className="ym-scheme-row" onClick={() => openSchemeDetail(s)}>
                <span style={styles.schemeRowDot} />
                <span>
                  <span style={styles.schemeRowName}>{s.scheme_name}</span>
                  <span style={styles.schemeRowCategory}>{s.category}</span>
                </span>
              </button>
            ))
          )}
        </div>
        <div style={styles.promoCard}>
          <strong style={{ fontSize: '13.5px' }}>Jan Seva · Sovereign AI</strong>
          <p style={{ fontSize: '12px', margin: '6px 0 0', opacity: 0.9 }}>AI-Powered Governance for Every Citizen</p>
        </div>
      </aside>

      {showApplyForm && (
        <ApplicationForm
          schemes={schemes}
          initialSchemeId={applySchemeId}
          onClose={() => { setShowApplyForm(false); setApplySchemeId(null) }}
          onRetryLoadSchemes={retryLoadSchemes}
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

      {showBrowseSchemes && (
        <div style={styles.overlay} onClick={() => setShowBrowseSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>All Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowBrowseSchemes(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.browseSearchRow}>
              <SearchIcon size={15} color="var(--color-charcoal-soft)" />
              <input
                style={styles.browseSearchInput}
                placeholder="Search schemes..."
                value={schemeSearch}
                onChange={(e) => setSchemeSearch(e.target.value)}
              />
            </div>
            <div style={styles.browseList}>
              {filteredSchemes.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '12px 0' }}>
                  {schemes.length === 0 ? 'Scheme list is still loading or unavailable.' : 'No schemes match your search.'}
                </p>
              ) : (
                filteredSchemes.map((s) => (
                  <button key={s.id} className="ym-scheme-row" style={styles.browseRow} onClick={() => openSchemeDetail(s)}>
                    <span style={styles.schemeRowDot} />
                    <span>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                      {s.benefits && <span style={styles.browseRowBenefit}>{s.benefits}</span>}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSavedSchemes && (
        <div style={styles.overlay} onClick={() => setShowSavedSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Saved Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSavedSchemes(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.browseList}>
              {savedSchemesList.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '12px 0' }}>
                  Nothing saved yet — open any scheme and tap "Save" to keep it here for later, even offline.
                </p>
              ) : (
                savedSchemesList.map((s) => (
                  <button key={s.id} className="ym-scheme-row" style={styles.browseRow} onClick={() => openSchemeDetail(s)}>
                    <span style={styles.schemeRowDot} />
                    <span>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                    </span>
                  </button>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  style={styles.saveIconBtn}
                  onClick={() => handleToggleSaved(viewingScheme)}
                  title={savedSchemeIds.includes(viewingScheme.id) ? 'Remove from saved' : 'Save for later'}
                >
                  <BookmarkIcon size={18} color="var(--color-forest)" filled={savedSchemeIds.includes(viewingScheme.id)} />
                </button>
                <button style={styles.browseCloseBtn} onClick={() => setViewingScheme(null)}>
                  <CloseIcon size={17} />
                </button>
              </div>
            </div>
            <div style={styles.detailBody}>
              {!isOnline && (
                <div style={styles.detailOfflineNote}>
                  Showing details saved on your device. Reconnect to ask Jan Seva follow-up questions in chat.
                </div>
              )}
              <div style={styles.detailMeta}>
                {viewingScheme.category} · {viewingScheme.level}
                {viewingScheme.scheme_name_hindi ? ` · ${viewingScheme.scheme_name_hindi}` : ''}
              </div>

              {viewingScheme.description && (
                <p style={styles.detailParagraph}>{viewingScheme.description}</p>
              )}

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Benefits</div>
                <FormattedField value={viewingScheme.benefits} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Who's eligible</div>
                <FormattedField value={viewingScheme.eligibility_criteria} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Documents needed</div>
                <FormattedField value={viewingScheme.documents_required} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>How to apply</div>
                <FormattedField value={viewingScheme.how_to_apply} />
              </div>
            </div>
            {isOnline && (
              <button className="ym-cta" style={styles.detailAskBtn} onClick={() => handleAskAboutScheme(viewingScheme)}>
                Ask Jan Seva about this in chat
              </button>
            )}
          </div>
        </div>
      )}

      {showProfile && (
        <div style={styles.overlay} onClick={() => setShowProfile(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Profile</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowProfile(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.detailBody}>
              <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)', margin: '0 0 14px', lineHeight: 1.5 }}>
                Saved only on this device. Fill this in once and reuse it to skip the intro questions in chat.
              </p>
              <label style={styles.formLabel}>
                Name
                <input
                  style={styles.formInput}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Radha Devi"
                />
              </label>
              <label style={styles.formLabel}>
                Age
                <input
                  style={styles.formInput}
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  placeholder="e.g. 45"
                  inputMode="numeric"
                />
              </label>
              <label style={styles.formLabel}>
                Occupation
                <select
                  style={styles.formInput}
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option>Farmer</option>
                  <option>Student</option>
                  <option>Homemaker</option>
                  <option>Business owner</option>
                  <option>Daily wage worker</option>
                  <option>Unemployed</option>
                  <option>Senior citizen</option>
                  <option>Other</option>
                </select>
              </label>
              <label style={styles.formLabel}>
                Location (district/state)
                <input
                  style={styles.formInput}
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g. Bhopal, Madhya Pradesh"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {profile && (
                <button style={styles.formSecondaryBtn} onClick={handleClearProfile}>Clear</button>
              )}
              <button className="ym-cta" style={{ ...styles.detailAskBtn, marginTop: 0 }} onClick={handleSaveProfile}>
                Save Profile
              </button>
            </div>
            {profile && isOnline && (
              <button style={styles.formLinkBtn} onClick={handleUseProfileInChat}>
                Use my profile in chat now
              </button>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div style={styles.overlay} onClick={() => setShowSettings(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Settings</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSettings(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.detailBody}>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Text size</div>
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
                      {size === 'normal' ? 'Normal' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Default voice language</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
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

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Offline data</div>
                <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)', margin: '4px 0 10px' }}>
                  {schemes.length > 0
                    ? `${schemes.length} schemes cached${getCacheAge() !== null ? ` · updated ${getCacheAge()} min ago` : ''}`
                    : 'No schemes cached yet'}
                  {' · '}{savedSchemeIds.length} saved
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #dcfce7',
    position: 'relative',
  },
  sidebarBrandTitle: { fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' },
  sidebarBrandSub: { fontSize: '10px', color: '#059669', fontWeight: 700, marginTop: '1px', whiteSpace: 'nowrap' },
  mobileCloseBtn: {
    display: 'none', marginLeft: 'auto', background: '#dcfce7', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer',
  },
  sidebarSectionLabel: {
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800,
    color: '#047857', margin: '8px 6px 2px',
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
    height: '100dvh',
    maxHeight: '100dvh',
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
    overflow: 'hidden',
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
  },
  langMenuWrap: { position: 'relative' },
  langMenuDropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#ffffff',
    borderRadius: '10px', boxShadow: '0 10px 28px rgba(15, 23, 42, 0.15)', padding: '6px',
    display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '130px', zIndex: 50,
    border: '1px solid #e2e8f0',
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
