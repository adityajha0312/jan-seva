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

  return `You are Yojana Mitra, a friendly assistant that helps Indian citizens (especially in Madhya Pradesh) find government schemes they may be eligible for.

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
    welcome: "Namaste! I'm Yojana Mitra. Tell me a bit about yourself — your occupation, age, or situation — and I'll help you find government schemes you may be eligible for.",
    online: 'Online',
    offline: 'Offline',
    placeholderIdle: "Type your message... (e.g. 'I am a farmer with 2 acres of land')",
    placeholderOffline: 'Reconnect to internet to keep chatting...',
    placeholderListening: 'Listening... speak now',
  },
  'hi-IN': {
    welcome: 'नमस्ते! मैं योजना मित्र हूँ। मुझे अपने बारे में थोड़ा बताएं — आपका व्यवसाय, उम्र, या स्थिति — और मैं आपको उन सरकारी योजनाओं को खोजने में मदद करूंगा जिनके लिए आप पात्र हो सकते हैं।',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    placeholderIdle: "अपना संदेश लिखें... (उदाहरण: 'मैं 2 एकड़ जमीन वाला किसान हूं')",
    placeholderOffline: 'बातचीत जारी रखने के लिए इंटरनेट से दोबारा जुड़ें...',
    placeholderListening: 'सुन रहा हूं... अब बोलें',
  },
  'mr-IN': {
    welcome: 'नमस्कार! मी योजना मित्र आहे. मला तुमच्याबद्दल थोडं सांगा — तुमचा व्यवसाय, वय किंवा परिस्थिती — आणि मी तुम्हाला पात्र असलेल्या सरकारी योजना शोधण्यात मदत करेन.',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    placeholderIdle: "तुमचा संदेश टाइप करा... (उदा. 'मी 2 एकर जमीन असलेला शेतकरी आहे')",
    placeholderOffline: 'गप्पा सुरू ठेवण्यासाठी इंटरनेटशी पुन्हा कनेक्ट करा...',
    placeholderListening: 'ऐकत आहे... आता बोला',
  },
  'ta-IN': {
    welcome: 'வணக்கம்! நான் யோஜனா மித்ரா. உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள் — உங்கள் தொழில், வயது அல்லது சூழ்நிலை — நீங்கள் தகுதி பெறக்கூடிய அரசு திட்டங்களைக் கண்டறிய நான் உதவுகிறேன்.',
    online: 'ஆன்லைன்',
    offline: 'ஆஃப்லைன்',
    placeholderIdle: "உங்கள் செய்தியை தட்டச்சு செய்யவும்... (எ.கா. 'நான் 2 ஏக்கர் நிலம் உள்ள விவசாயி')",
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

  function handleClearSaved() {
    clearSavedSchemes()
    setSavedSchemeIds([])
    showToast('Saved schemes cleared')
  }

  function handleAskAboutScheme(scheme) {
    setShowBrowseSchemes(false)
    setViewingScheme(null)
    setIsMobileNavOpen(false)
    handleSend(`Tell me more about ${scheme.scheme_name} and whether I might be eligible.`)
  }

  function openSchemeDetail(scheme) {
    setShowBrowseSchemes(false)
    setShowSavedSchemes(false)
    setIsMobileNavOpen(false)
    setViewingScheme(scheme)
  }

  function handleToggleSaved(scheme) {
    const nowSaved = toggleSavedScheme(scheme.id)
    setSavedSchemeIds(getSavedSchemeIds())
    showToast(nowSaved ? 'Saved for later' : 'Removed from saved')
  }

  function handleMicClick() {
    if (isListening) {
      listenControllerRef.current?.stop()
      setIsListening(false)
      return
    }
    stopSpeaking()
    setIsListening(true)
    listenControllerRef.current = startListening({
      lang: voiceLang,
      onResult: (transcript, isFinal) => {
        setInput(transcript)
        if (isFinal && transcript.trim()) {
          setIsListening(false)
          handleSend(transcript)
        }
      },
      onEnd: () => {
        setIsListening(false)
      },
      onError: (err) => {
        setIsListening(false)
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
          <Logo size={30} />
          <div>
            <div style={styles.sidebarBrandTitle}>Yojana Mitra</div>
            <div style={styles.sidebarBrandSub}>Your Scheme Companion</div>
          </div>
          <button className="ym-mobile-close-btn" style={styles.mobileCloseBtn} onClick={() => setIsMobileNavOpen(false)} aria-label="Close menu">
            <CloseIcon size={16} color="var(--color-cream)" />
          </button>
        </div>

        <button className="ym-nav-item ym-nav-active" onClick={handleClearChat} style={{ marginTop: '6px' }}>
          <PlusChatIcon size={16} /> New Chat
        </button>

        <div style={styles.sidebarSectionLabel}>Browse</div>
        <button className="ym-nav-item" onClick={() => { setShowBrowseSchemes(true); setIsMobileNavOpen(false) }}>
          <GridIcon size={16} /> Schemes
        </button>
        <button className="ym-nav-item" onClick={() => { setShowScorecard(true); setIsMobileNavOpen(false) }}>
          <CalculatorIcon size={16} /> Eligibility Scorecard
        </button>
        <button className="ym-nav-item" onClick={() => { setShowGrievance(true); setIsMobileNavOpen(false) }}>
          <ShieldAlertIcon size={16} /> CM Helpline 181
        </button>
        <button className="ym-nav-item" onClick={() => { setShowApplyForm(true); setIsMobileNavOpen(false) }}>
          <DocumentIcon size={16} /> My Applications
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSavedSchemes(true); setIsMobileNavOpen(false) }}>
          <BookmarkIcon size={16} /> Saved Schemes
        </button>

        <div style={styles.sidebarSectionLabel}>Governance & Account</div>
        <button className="ym-nav-item" onClick={() => { setShowAdminDashboard(true); setIsMobileNavOpen(false) }}>
          <BarChartIcon size={16} /> GovTech Portal
        </button>
        <button className="ym-nav-item" onClick={() => { setProfileForm(profile || { name: '', age: '', occupation: '', location: '' }); setShowProfile(true); setIsMobileNavOpen(false) }}>
          <UserCircleIcon size={16} /> Profile
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSettings(true); setIsMobileNavOpen(false) }}>
          <SettingsGearIcon size={16} /> Settings
        </button>
        <button className="ym-nav-item" onClick={() => { setShowLinks((s) => !s); setIsMobileNavOpen(false) }}>
          <GlobeIcon size={16} /> Official Sites
        </button>
        <button className="ym-nav-item" onClick={() => { setShowApplyForm(true); setIsMobileNavOpen(false) }}>
          <DocumentIcon size={16} /> Apply for Scheme
        </button>

        <div style={styles.sidebarHelp}>
          <div style={styles.sidebarHelpAvatar}><Logo size={20} /></div>
          <div style={styles.sidebarHelpTitle}>Need help?</div>
          <div style={styles.sidebarHelpText}>Use voice, type, or ask in your preferred language.</div>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-nav-item'}
              style={styles.sidebarVoiceBtn}
              onClick={() => { handleMicClick(); setIsMobileNavOpen(false) }}
              disabled={loadingSchemes || !isOnline}
            >
              <MicIcon size={14} color={isListening ? 'white' : 'var(--color-cream)'} /> {isListening ? 'Listening...' : 'Try Voice'}
            </button>
          )}
        </div>
      </aside>

      {/* Main chat column */}
      <div style={styles.mainCol}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button className="ym-mobile-menu-btn" style={styles.mobileMenuBtn} onClick={() => setIsMobileNavOpen(true)} aria-label="Open menu">
              <MenuIcon size={19} color="var(--color-cream)" />
            </button>
            <div>
              <h1 className="ym-title-text" style={styles.title}>Yojana Mitra</h1>
              <p className="ym-subtitle-text" style={styles.subtitle}>
                <span style={{ ...styles.statusDot, background: isOnline ? '#3fbf6b' : '#c97f1e' }} />
                {isOnline ? t(voiceLang, 'online') : t(voiceLang, 'offline')}
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              className="ym-icon-btn"
              onClick={() => setShowScorecard(true)}
              title="Citizen Eligibility Scorecard"
            >
              <CalculatorIcon size={13} /> Scorecard
            </button>
            <button
              className="ym-icon-btn"
              onClick={() => setShowGrievance(true)}
              title="CM Helpline 181 Grievance"
            >
              <ShieldAlertIcon size={13} /> 181 Helpline
            </button>
            <button
              className="ym-icon-btn"
              onClick={() => setShowAdminDashboard(true)}
              title="GovTech Intelligence & Admin Portal"
            >
              <BarChartIcon size={13} /> GovTech
            </button>
            {isVoiceInputSupported && (
              <div style={styles.langMenuWrap} onClick={(e) => e.stopPropagation()}>
                <button
                  className="ym-icon-btn"
                  onClick={() => setShowLangMenu((s) => !s)}
                  title="Voice input/output language"
                >
                  <GlobeIcon size={13} /> {VOICE_LANGUAGES.find((l) => l.code === voiceLang)?.label}
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
                {speakEnabled ? <SpeakerOnIcon size={15} /> : <SpeakerOffIcon size={15} />}
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
            rows={2}
            disabled={loadingSchemes || !isOnline}
          />
          <button
            className="ym-send-btn"
            style={styles.sendButton}
            onClick={() => handleSend()}
            disabled={loading || loadingSchemes || !input.trim() || !isOnline}
            aria-label="Send"
          >
            <SendIcon size={16} color="var(--color-cream)" />
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
          <strong style={{ fontSize: '13.5px' }}>Many schemes. One platform.</strong>
          <p style={{ fontSize: '12px', margin: '6px 0 0', opacity: 0.9 }}>Yojana Mitra — always with you.</p>
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
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '16px 0', textAlign: 'center' }}>
                  No saved schemes yet. Tap the bookmark icon on any scheme to save it for quick offline reference.
                </p>
              ) : (
                savedSchemesList.map((s) => (
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

      {viewingScheme && (
        <div style={styles.overlay} onClick={() => setViewingScheme(null)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <div>
                <h2 style={styles.browseTitle}>{viewingScheme.scheme_name}</h2>
                {viewingScheme.scheme_name_hindi && (
                  <div style={styles.detailHindiTitle}>{viewingScheme.scheme_name_hindi}</div>
                )}
                <span style={styles.detailBadge}>{viewingScheme.category} · {viewingScheme.level}</span>
              </div>
              <button style={styles.browseCloseBtn} onClick={() => setViewingScheme(null)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.detailBody}>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Description</div>
                <p style={styles.detailText}>{viewingScheme.description}</p>
              </div>
              {viewingScheme.benefits && (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>Benefits</div>
                  <p style={styles.detailText}>{viewingScheme.benefits}</p>
                </div>
              )}
              {viewingScheme.eligibility_criteria && (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>Eligibility Criteria</div>
                  <FormattedField value={viewingScheme.eligibility_criteria} />
                </div>
              )}
              {viewingScheme.documents_required && (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>Documents Required</div>
                  <FormattedField value={viewingScheme.documents_required} />
                </div>
              )}
              {viewingScheme.how_to_apply && (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>How to Apply</div>
                  <p style={styles.detailText}>{viewingScheme.how_to_apply}</p>
                </div>
              )}
            </div>
            <div style={styles.detailFooter}>
              <button
                style={{
                  ...styles.detailBookmarkBtn,
                  ...(savedSchemeIds.includes(viewingScheme.id) ? styles.detailBookmarkActive : {}),
                }}
                onClick={() => handleToggleSaved(viewingScheme)}
              >
                <BookmarkIcon size={14} filled={savedSchemeIds.includes(viewingScheme.id)} />
                {savedSchemeIds.includes(viewingScheme.id) ? 'Saved' : 'Save'}
              </button>
              {isOnline && (
                <button className="ym-cta" style={styles.detailAskBtn} onClick={() => handleAskAboutScheme(viewingScheme)}>
                  Ask in Chat →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div style={styles.overlay} onClick={() => setShowProfile(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Your Profile</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowProfile(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Saved locally on this device — fills your intro in chat with one tap so you don't have to retype your situation every time.
            </p>
            <div style={styles.formGrid}>
              <label style={styles.formFieldLabel}>
                Name (optional)
                <input
                  style={styles.formInput}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Ramesh"
                />
              </label>
              <label style={styles.formFieldLabel}>
                Age
                <input
                  style={styles.formInput}
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  placeholder="e.g. 42"
                />
              </label>
              <label style={styles.formFieldLabel}>
                Occupation
                <input
                  style={styles.formInput}
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                  placeholder="e.g. Farmer, Student, Homemaker"
                />
              </label>
              <label style={styles.formFieldLabel}>
                Location / District
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
                <div style={styles.detailSectionTitle}>Default language</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
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
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    padding: '18px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    overflowY: 'auto',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginBottom: '14px',
    position: 'relative',
  },
  sidebarBrandTitle: { fontSize: '15px', fontWeight: 700, lineHeight: 1.2 },
  sidebarBrandSub: { fontSize: '10.5px', opacity: 0.75 },
  mobileCloseBtn: {
    display: 'none',
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  sidebarSectionLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    opacity: 0.6,
    padding: '12px 10px 4px',
  },
  sidebarHelp: {
    marginTop: 'auto',
    padding: '14px 12px 6px',
    borderRadius: '12px',
    background: 'rgba(250,247,240,0.06)',
    border: '1px solid rgba(250,247,240,0.1)',
  },
  sidebarHelpAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(250,247,240,0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  sidebarHelpTitle: { fontSize: '13px', fontWeight: 700 },
  sidebarHelpText: { fontSize: '11px', opacity: 0.8, lineHeight: 1.4, margin: '2px 0 10px' },
  sidebarVoiceBtn: {
    background: 'rgba(250,247,240,0.14)',
    border: '1px solid rgba(250,247,240,0.25)',
    borderRadius: '8px',
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    color: 'var(--color-cream)',
  },
  sidebarRight: {
    background: 'var(--color-cream)',
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    borderLeft: '1px solid rgba(20,83,45,0.12)',
    overflowY: 'auto',
  },
  rightCard: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid rgba(20,83,45,0.1)',
  },
  rightCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    fontWeight: 700,
    color: 'var(--color-forest)',
    marginBottom: '8px',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    fontSize: '11.5px',
    color: 'var(--color-marigold-dark)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  schemeRowDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--color-marigold)',
    marginTop: '6px',
    flexShrink: 0,
  },
  schemeRowName: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--color-charcoal)',
    lineHeight: 1.3,
  },
  schemeRowCategory: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--color-charcoal-soft)',
    marginTop: '2px',
  },
  promoCard: {
    marginTop: 'auto',
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    padding: '14px',
    borderRadius: '12px',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 0,
    background: 'var(--color-cream)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    borderBottom: '1px solid rgba(250,247,240,0.12)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  mobileMenuBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  title: {
    margin: 0,
    fontSize: '16.5px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '11.5px',
    opacity: 0.85,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  langMenuWrap: {
    position: 'relative',
  },
  langMenuDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#ffffff',
    color: 'var(--color-charcoal)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(20,83,45,0.22)',
    border: '1px solid rgba(20,83,45,0.12)',
    padding: '4px',
    zIndex: 30,
    minWidth: '120px',
    display: 'flex',
    flexDirection: 'column',
  },
  langMenuItem: {
    background: 'transparent',
    border: 'none',
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    borderRadius: '6px',
  },
  langMenuItemActive: {
    background: 'var(--color-sage)',
    color: 'var(--color-forest)',
    fontWeight: 700,
  },
  offlineBanner: {
    background: '#fff3cd',
    color: '#664d03',
    padding: '9px 18px',
    fontSize: '12.5px',
    borderBottom: '1px solid #ffe69c',
  },
  offlineSchemeList: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid rgba(20,83,45,0.15)',
    margin: '12px 0',
  },
  offlineListTitle: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: 'var(--color-forest)',
    margin: '0 0 8px',
  },
  offlineSchemeItem: {
    marginBottom: '6px',
    borderBottom: '1px solid rgba(20,83,45,0.08)',
    paddingBottom: '8px',
  },
  offlineSchemeCategory: {
    fontSize: '11px',
    color: 'var(--color-charcoal-soft)',
    margin: '2px 0 4px',
  },
  linksBar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 18px',
    overflowX: 'auto',
    background: '#ffffff',
    borderBottom: '1px solid rgba(20,83,45,0.1)',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bubble: {
    padding: '13px 15px',
    borderRadius: '16px',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
    fontSize: '15px',
  },
  userBubble: {
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: '#ffffff',
    color: 'var(--color-charcoal)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 4px rgba(20,83,45,0.08)',
    border: '1px solid rgba(20,83,45,0.06)',
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
    gap: '8px',
    padding: '12px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
    borderTop: '1px solid rgba(20,83,45,0.12)',
    background: '#ffffff',
  },
  textInput: {
    flex: 1,
    resize: 'none',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(20,83,45,0.2)',
    fontSize: '15px',
    fontFamily: 'inherit',
    background: 'var(--color-cream)',
  },
  sendButton: {
    padding: '0 20px',
    borderRadius: '12px',
    border: 'none',
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20,83,45,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 50,
  },
  browseModal: {
    background: 'var(--color-cream)',
    borderRadius: '16px',
    padding: '18px',
    maxWidth: '540px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-body)',
  },
  browseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  browseTitle: {
    margin: 0,
    fontSize: '18px',
    color: 'var(--color-forest)',
    fontWeight: 700,
  },
  browseCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-charcoal-soft)',
    padding: '4px',
  },
  browseSearchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid rgba(20,83,45,0.18)',
    marginBottom: '10px',
  },
  browseSearchInput: {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontSize: '13.5px',
    fontFamily: 'inherit',
  },
  browseList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  browseRow: {
    background: '#ffffff',
    border: '1px solid rgba(20,83,45,0.08)',
  },
  browseRowBenefit: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--color-marigold-dark)',
    marginTop: '2px',
    fontWeight: 600,
  },
  detailModal: {
    background: 'var(--color-cream)',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-body)',
  },
  detailHindiTitle: {
    fontSize: '13px',
    color: 'var(--color-charcoal-soft)',
    marginTop: '2px',
  },
  detailBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-forest)',
    background: 'var(--color-sage)',
    padding: '3px 8px',
    borderRadius: '999px',
    marginTop: '6px',
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto',
    margin: '12px 0',
  },
  detailSection: {
    marginBottom: '12px',
  },
  detailSectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-forest)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '4px',
  },
  detailText: {
    fontSize: '13.5px',
    lineHeight: 1.5,
    margin: 0,
    color: 'var(--color-charcoal)',
  },
  detailFooter: {
    display: 'flex',
    gap: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(20,83,45,0.12)',
  },
  detailBookmarkBtn: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(20,83,45,0.2)',
    background: '#ffffff',
    color: 'var(--color-charcoal)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  detailBookmarkActive: {
    background: 'var(--color-sage)',
    borderColor: 'var(--color-forest)',
    color: 'var(--color-forest)',
  },
  detailAskBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  formFieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-forest)',
  },
  formInput: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(20,83,45,0.2)',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: '#ffffff',
  },
  formSecondaryBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(20,83,45,0.2)',
    background: '#ffffff',
    color: 'var(--color-charcoal)',
    fontSize: '12.5px',
    cursor: 'pointer',
  },
  formLinkBtn: {
    background: 'none',
    border: 'none',
    padding: '8px 0 0',
    color: 'var(--color-forest)',
    fontSize: '12.5px',
    fontWeight: 600,
    textDecoration: 'underline',
    cursor: 'pointer',
    textAlign: 'center',
  },
  formToggleBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(20,83,45,0.2)',
    background: '#ffffff',
    color: 'var(--color-charcoal)',
    fontSize: '12.5px',
    cursor: 'pointer',
  },
  formToggleBtnActive: {
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    borderColor: 'var(--color-forest)',
    fontWeight: 700,
  },
}
