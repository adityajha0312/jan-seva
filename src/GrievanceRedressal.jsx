import { useState, useRef } from 'react'
import { askGemini } from './lib/gemini'
import { startListening, stopSpeaking, isVoiceInputSupported } from './lib/speech'
import { isCurrentlyOnline } from './lib/offline'
import { CloseIcon, MicIcon, StopIcon, DocumentIcon, ArrowRightIcon } from './Icons'

const MP_DISTRICTS = [
  'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind',
  'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar',
  'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad (Narmadapuram)', 'Indore', 'Jabalpur',
  'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur',
  'Neemuch', 'Niwari', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna',
  'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli',
  'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'
]

const QUICK_GRIEVANCE_TEMPLATES = [
  {
    title: 'Ration / PDS Issue',
    dept: 'Food, Civil Supplies & Consumer Protection',
    desc: 'Ration card not issued or subsidized foodgrains not distributed for 2+ months by the local fair price shop dealer.'
  },
  {
    title: 'PM-KISAN / Land Record',
    dept: 'Revenue Department (Panchayat/Tehsil)',
    desc: 'Kisan Samman Nidhi installment stopped due to land record / e-KYC mismatch pending at the Tehsil office.'
  },
  {
    title: 'PMAY Housing Subsidy Delay',
    dept: 'Panchayat and Rural Development',
    desc: 'First installment of PM Awas Yojana credited, construction completed up to plinth level, but geo-tagging inspection is stalled.'
  },
  {
    title: 'Drinking Water / Handpump Repair',
    dept: 'Public Health Engineering (PHE)',
    desc: 'Community tube-well / Nal-Jal pipeline broken in village ward for over 3 weeks with no response from local administration.'
  },
  {
    title: 'Ladli Behna DBT Transfer',
    dept: 'Women & Child Development',
    desc: 'Application approved and DBT enabled on bank account, but monthly financial benefit not credited for the current cycle.'
  }
]

// Mock tracker database for demo mode & persistence
const DEFAULT_TRACKED_COMPLAINTS = [
  {
    token: 'MP-CMH-2026-89421',
    applicant: 'Rameshwar Patidar',
    district: 'Sehore',
    dept: 'Revenue Department',
    subject: 'Delay in Land Mutation (Namantaran) after registry',
    status: 'In Progress',
    step: 2,
    date: '27 Sep 2026',
    slaDate: '04 Oct 2026 (7 Days SLA)',
    officer: 'Shri V. Sharma (Naib Tehsildar, Ichhawar)'
  },
  {
    token: 'MP-CMH-2026-78119',
    applicant: 'Geeta Bai Ahirwar',
    district: 'Bhopal',
    dept: 'Food & Civil Supplies',
    subject: 'Addition of newborn child to BPL Ration Card',
    status: 'Resolved',
    step: 4,
    date: '18 Sep 2026',
    slaDate: 'Resolved in 4 days',
    officer: 'Smt. R. Dwivedi (Food Inspector)'
  }
]

export default function GrievanceRedressal({ onClose, defaultProfile }) {
  const [activeTab, setActiveTab] = useState('lodge') // 'lodge' | 'track'
  const [applicantName, setApplicantName] = useState(defaultProfile?.name || '')
  const [mobileNumber, setMobileNumber] = useState('')
  const [district, setDistrict] = useState(defaultProfile?.location || 'Bhopal')
  const [tehsilWard, setTehsilWard] = useState('')
  const [grievanceText, setGrievanceText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatedPetition, setGeneratedPetition] = useState(null)
  const [copied, setCopied] = useState(false)

  // Tracking state
  const [trackTokenInput, setTrackTokenInput] = useState('')
  const [trackedList, setTrackedList] = useState(DEFAULT_TRACKED_COMPLAINTS)
  const [trackedResult, setTrackedResult] = useState(null)
  const [trackError, setTrackError] = useState(null)

  const listenControllerRef = useRef(null)

  function handleVoiceInput() {
    if (isListening) {
      if (listenControllerRef.current) {
        listenControllerRef.current.stop()
        listenControllerRef.current = null
      }
      setIsListening(false)
      return
    }

    stopSpeaking()
    listenControllerRef.current = startListening({
      lang: 'hi-IN',
      onResult: (transcript) => {
        setIsListening(false)
        listenControllerRef.current = null
        if (transcript && transcript.trim()) {
          setGrievanceText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()))
        }
      },
      onError: () => {
        setIsListening(false)
        listenControllerRef.current = null
      }
    })
    setIsListening(true)
  }

  function handleSelectTemplate(tpl) {
    setGrievanceText(tpl.desc)
  }

  async function handleGenerateAndFile() {
    if (!grievanceText.trim()) return

    setAnalyzing(true)
    const token = `MP-CMH-2026-${Math.floor(10000 + Math.random() * 90000)}`

    const prompt = `You are the Madhya Pradesh CM Helpline 181 & Lok Sewa Guarantee Act Redressal AI Officer.
A citizen has reported the following grievance:
Applicant Name: ${applicantName || 'Citizen Applicant'}
Mobile: ${mobileNumber || 'Not provided'}
District: ${district}
Tehsil/Ward: ${tehsilWard || 'Local Block'}
Issue Description: "${grievanceText}"

Generate a clean JSON response with the following keys:
- department: The exact government department responsible in MP (e.g. "Revenue Department (Panchayat/Tehsil)", "Food, Civil Supplies and Consumer Protection", "Public Health Engineering", "Women and Child Development", "School Education")
- category: A concise official classification of the issue (e.g. "PDS Ration Distribution Irregularity", "Delay in Land Record Mutation", "Drinking Water Infrastructure Deficit")
- urgency: "Standard" | "High" | "Critical"
- slaDays: Target SLA resolution days under MP Public Service Guarantee Act 2010 (number between 3 and 15, default 7)
- summary: A 2-sentence executive summary of the complaint
- formalPetition: A formal representation drafted to the Sub-Divisional Officer (SDM) / District Magistrate citing the MP Public Services Guarantee Act 2010 and demanding action within SLA.
- recommendedAction: What the citizen should expect next (e.g. "Nodal officer will call within 48 hours for spot inspection.")`

    try {
      const reply = await askGemini(prompt, [{ role: 'user', text: 'Analyze and draft official CM Helpline grievance petition.' }])
      let parsed = null
      try {
        const jsonMatch = reply.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch (e) {
        // Fallback handled below
      }

      const petitionData = {
        token,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        applicant: applicantName || 'Citizen Applicant',
        mobile: mobileNumber || 'Registered Mobile',
        district,
        department: parsed?.department || 'District Administration (Collectorate)',
        category: parsed?.category || 'Public Service Delivery Grievance',
        urgency: parsed?.urgency || 'High',
        slaDays: parsed?.slaDays || 7,
        summary: parsed?.summary || `Grievance registered regarding ${grievanceText.slice(0, 100)}... under MP Public Service Guarantee Act.`,
        formalPetition: parsed?.formalPetition || `To,\nThe Sub-Divisional Magistrate (SDM) / Collector,\nDistrict ${district}, Government of Madhya Pradesh.\n\nSUBJECT: Formal Grievance Petition under MP Public Services Guarantee Act 2010 & CM Helpline 181.\n\nRespected Sir/Madam,\n\nI, ${applicantName || 'the undersigned applicant'}, residing in ${tehsilWard || district}, District ${district}, submit this formal grievance regarding:\n"${grievanceText}"\n\nDespite repeated verbal submissions, the entitled public service has not been delivered within the statutory timeline. I request immediate inspection, strict adherence to the 7-day SLA under the Guarantee Act, and formal action.\n\nYours faithfully,\n${applicantName || 'Citizen Applicant'}\nContact: ${mobileNumber || 'Registered Mobile'}\nDate: ${new Date().toLocaleDateString('en-IN')}`,
        recommendedAction: parsed?.recommendedAction || 'Keep this CM Helpline Token number handy. You will receive an automated IVR call & SMS confirmation on your mobile.'
      }

      setGeneratedPetition(petitionData)
      setTrackedList((prev) => [
        {
          token,
          applicant: petitionData.applicant,
          district,
          dept: petitionData.department,
          subject: petitionData.category,
          status: 'Lodged (Under Scrutiny)',
          step: 1,
          date: petitionData.date,
          slaDate: `${petitionData.slaDays} Days SLA`,
          officer: `SDM Nodal Officer (${district})`
        },
        ...prev
      ])
    } catch (err) {
      const fallback = {
        token,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        applicant: applicantName || 'Citizen Applicant',
        mobile: mobileNumber || 'Registered Mobile',
        district,
        department: grievanceText.toLowerCase().includes('ration') || grievanceText.toLowerCase().includes('pds')
          ? 'Food, Civil Supplies and Consumer Protection Dept.'
          : grievanceText.toLowerCase().includes('kisan') || grievanceText.toLowerCase().includes('land')
          ? 'Revenue Department (Collectorate / Tehsil)'
          : 'Panchayat & Rural Development Department',
        category: 'Citizen Public Service Grievance',
        urgency: 'High',
        slaDays: 7,
        summary: `Grievance submitted regarding public service delivery failure in ${district}. Citizen alleges delay exceeding the statutory time limit under Madhya Pradesh Public Services Guarantee Act 2010.`,
        formalPetition: `To,\nThe District Magistrate / Sub-Divisional Officer (SDM)\nDistrict ${district}, Government of Madhya Pradesh\n\nSUBJECT: Formal Representation & Grievance under MP CM Helpline 181 and Lok Sewa Guarantee Act.\n\nRespected Sir/Madam,\n\nI, ${applicantName || 'Applicant'}, resident of ${tehsilWard || 'Tehsil/Ward'}, District ${district}, submit this formal grievance regarding:\n"${grievanceText}"\n\nDespite repeated submissions at the local panchayat/block level, no redressal has been provided within the designated timeline stipulated under the Public Service Guarantee Act 2010.\n\nRELIEF PRAYED FOR:\n1. Immediate inquiry and issuance of directive to the concerned nodal department.\n2. Redressal of service deficit within the mandated 7-day SLA.\n3. Intimation of action taken report via SMS to ${mobileNumber || 'registered mobile'}.\n\nYours faithfully,\n${applicantName || 'Citizen Applicant'}\nDate: ${new Date().toLocaleDateString('en-IN')}`,
        recommendedAction: 'Keep this CM Helpline Token number handy. You will receive an automated IVR call & SMS confirmation on your mobile.'
      }
      setGeneratedPetition(fallback)
      setTrackedList((prev) => [
        {
          token,
          applicant: fallback.applicant,
          district,
          dept: fallback.department,
          subject: fallback.category,
          status: 'Lodged (Under Scrutiny)',
          step: 1,
          date: fallback.date,
          slaDate: '7 Days SLA',
          officer: `SDM Nodal Officer (${district})`
        },
        ...prev
      ])
    } finally {
      setAnalyzing(false)
    }
  }

  function handleTrackLookup() {
    setTrackError(null)
    const query = trackTokenInput.trim().toUpperCase()
    if (!query) return

    const found = trackedList.find((item) => item.token.toUpperCase() === query)
    if (found) {
      setTrackedResult(found)
    } else {
      setTrackedResult(null)
      setTrackError('Token ID not found. Try one of the recent tokens listed below.')
    }
  }

  function handlePrintPetition() {
    window.print()
  }

  function handleCopyPetition() {
    if (generatedPetition?.formalPetition) {
      navigator.clipboard.writeText(generatedPetition.formalPetition)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="ym-modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="ym-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.badge}>GovTech · CM Helpline 181</span>
            <h2 style={styles.title}>AI Citizen Grievance Redressal</h2>
            <p style={styles.subtitle}>
              Voice or text grievance drafting with auto-classification under the MP Public Service Guarantee Act.
            </p>
          </div>
          <button className="ym-close-pill-btn" onClick={onClose} aria-label="Close" title="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'lodge' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('lodge')}
          >
            <DocumentIcon size={15} /> Lodge New Grievance
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'track' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('track')}
          >
            🔍 Track CM Helpline Status
          </button>
        </div>

        {activeTab === 'lodge' ? (
          <div>
            {!generatedPetition ? (
              <div>
                {/* Quick Templates */}
                <div style={styles.quickSection}>
                  <div style={styles.sectionHeading}>Common MP Public Service Grievance Templates:</div>
                  <div style={styles.quickGrid}>
                    {QUICK_GRIEVANCE_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        style={styles.quickCard}
                        onClick={() => handleSelectTemplate(tpl)}
                      >
                        <div style={styles.quickCardTitle}>{tpl.title}</div>
                        <div style={styles.quickCardDept}>{tpl.dept}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields */}
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.fieldLabel}>Applicant Full Name</label>
                    <input
                      style={styles.input}
                      placeholder="e.g. Rameshwar Patidar"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Mobile Number (For SMS updates)</label>
                    <input
                      style={styles.input}
                      placeholder="e.g. 98260XXXXX"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Madhya Pradesh District</label>
                    <select
                      style={styles.select}
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    >
                      {MP_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.fieldLabel}>Tehsil / Block / Gram Panchayat</label>
                    <input
                      style={styles.input}
                      placeholder="e.g. Ichhawar / Ward 12"
                      value={tehsilWard}
                      onChange={(e) => setTehsilWard(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={styles.fieldLabel}>Describe the issue in your own words (Hindi, English, or spoken):</label>
                    {isVoiceInputSupported && (
                      <button
                        style={{ ...styles.voiceBtn, ...(isListening ? styles.voiceBtnActive : {}) }}
                        onClick={handleVoiceInput}
                        type="button"
                      >
                        {isListening ? <StopIcon size={14} color="#fff" /> : <MicIcon size={14} color="var(--color-forest)" />}
                        <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    style={styles.textarea}
                    placeholder="e.g. Hamare gaanv me 2 mahine se ration nahi mila hai, kotedar machine kharab batata hai..."
                    value={grievanceText}
                    onChange={(e) => setGrievanceText(e.target.value)}
                  />
                </div>

                <button
                  className="ym-cta"
                  style={{ ...styles.submitBtn, opacity: analyzing ? 0.7 : 1 }}
                  onClick={handleGenerateAndFile}
                  disabled={analyzing || !grievanceText.trim()}
                >
                  {analyzing ? 'Drafting Official Petition with AI...' : 'Draft Legal Petition & Lodge on CM Helpline 181 →'}
                </button>
              </div>
            ) : (
              /* Success / Result View */
              <div style={styles.resultView}>
                <div style={styles.resultHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={styles.tokenBadge}>Token: {generatedPetition.token}</span>
                    <span style={styles.urgencyBadge}>{generatedPetition.urgency} Urgency</span>
                    <span style={styles.slaBadge}>Statutory SLA: {generatedPetition.slaDays} Days</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-charcoal-soft)' }}>
                    Filing Date: {generatedPetition.date}
                  </div>
                </div>

                <div style={styles.classificationGrid}>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Assigned Department:</div>
                    <div style={styles.classVal}>{generatedPetition.department}</div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Category:</div>
                    <div style={styles.classVal}>{generatedPetition.category}</div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Citizen Applicant:</div>
                    <div style={styles.classVal}>{generatedPetition.applicant} ({generatedPetition.district})</div>
                  </div>
                </div>

                <div style={styles.noticeBox}>
                  <strong>Action Notice:</strong> {generatedPetition.recommendedAction}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={styles.sectionHeading}>Official Representation & Legal Petition:</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={styles.actionBtnSmall} onClick={handleCopyPetition}>
                        {copied ? '✓ Copied' : 'Copy Petition'}
                      </button>
                      <button style={styles.actionBtnSmall} onClick={handlePrintPetition}>
                        Print Slip
                      </button>
                    </div>
                  </div>
                  <pre style={styles.petitionPre}>{generatedPetition.formalPetition}</pre>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    style={styles.resetBtn}
                    onClick={() => {
                      setGeneratedPetition(null)
                      setGrievanceText('')
                    }}
                  >
                    + Lodge Another Grievance
                  </button>
                  <button
                    className="ym-cta"
                    style={{ ...styles.submitBtn, marginTop: 0, flex: 1 }}
                    onClick={() => {
                      setActiveTab('track')
                      setTrackTokenInput(generatedPetition.token)
                      setTrackedResult(trackedList[0])
                    }}
                  >
                    Track Status in Real-Time →
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tracker Tab */
          <div>
            <div style={styles.trackInputRow}>
              <input
                style={styles.trackInput}
                placeholder="Enter 14-digit CM Helpline Token (e.g. MP-CMH-2026-89421)"
                value={trackTokenInput}
                onChange={(e) => setTrackTokenInput(e.target.value)}
              />
              <button className="ym-cta" style={styles.trackBtn} onClick={handleTrackLookup}>
                Track Status
              </button>
            </div>

            {trackError && <div style={styles.errorText}>{trackError}</div>}

            {trackedResult && (
              <div style={styles.statusCard}>
                <div style={styles.statusCardTop}>
                  <div>
                    <span style={styles.tokenBadge}>{trackedResult.token}</span>
                    <h3 style={styles.statusSubject}>{trackedResult.subject}</h3>
                    <div style={styles.statusSub}>
                      Dept: <strong>{trackedResult.dept}</strong> · District: <strong>{trackedResult.district}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={styles.liveStatusPill}>{trackedResult.status}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-charcoal-soft)', marginTop: '4px' }}>
                      Target: {trackedResult.slaDate}
                    </div>
                  </div>
                </div>

                {/* Visual 4-Step SLA Progress */}
                <div style={styles.timeline}>
                  <div style={styles.timelineStep}>
                    <div style={{ ...styles.stepCircle, ...(trackedResult.step >= 1 ? styles.stepCircleDone : {}) }}>1</div>
                    <div style={styles.stepTitle}>Lodged</div>
                  </div>
                  <div style={{ ...styles.stepLine, ...(trackedResult.step >= 2 ? styles.stepLineDone : {}) }} />
                  <div style={styles.timelineStep}>
                    <div style={{ ...styles.stepCircle, ...(trackedResult.step >= 2 ? styles.stepCircleDone : {}) }}>2</div>
                    <div style={styles.stepTitle}>Nodal Assigned</div>
                  </div>
                  <div style={{ ...styles.stepLine, ...(trackedResult.step >= 3 ? styles.stepLineDone : {}) }} />
                  <div style={styles.timelineStep}>
                    <div style={{ ...styles.stepCircle, ...(trackedResult.step >= 3 ? styles.stepCircleDone : {}) }}>3</div>
                    <div style={styles.stepTitle}>Field Inquiry</div>
                  </div>
                  <div style={{ ...styles.stepLine, ...(trackedResult.step >= 4 ? styles.stepLineDone : {}) }} />
                  <div style={styles.timelineStep}>
                    <div style={{ ...styles.stepCircle, ...(trackedResult.step >= 4 ? styles.stepCircleDone : {}) }}>4</div>
                    <div style={styles.stepTitle}>Redressed</div>
                  </div>
                </div>
              </div>
            )}

            {/* List of sample / existing tokens */}
            <div style={{ marginTop: '20px' }}>
              <div style={styles.sectionHeading}>Recently Filed Grievances (Click to Track):</div>
              <div style={styles.recentList}>
                {trackedList.map((item) => (
                  <button
                    key={item.token}
                    style={styles.recentItem}
                    onClick={() => {
                      setTrackTokenInput(item.token)
                      setTrackedResult(item)
                      setTrackError(null)
                    }}
                  >
                    <div>
                      <strong>{item.token}</strong> — {item.subject}
                      <div style={{ fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginTop: '2px' }}>
                        {item.dept} · {item.district} · {item.date}
                      </div>
                    </div>
                    <span style={styles.recentStatus}>{item.status}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', zIndex: 9999, backdropFilter: 'blur(5px)',
  },
  modal: {
    background: '#ffffff', borderRadius: '18px', padding: '24px',
    maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
    position: 'relative',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px' },
  headerLeft: { flex: 1, minWidth: 0, paddingRight: '12px' },
  badge: {
    display: 'inline-block', fontSize: '11px', fontWeight: 700, color: 'var(--color-forest)',
    background: 'rgba(20,83,45,0.1)', padding: '3px 10px', borderRadius: '999px', marginBottom: '6px',
  },
  title: { margin: 0, fontSize: '21px', color: 'var(--color-forest)', fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: 'var(--color-charcoal-soft)', lineHeight: 1.4 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-charcoal-soft)' },
  tabBar: { display: 'flex', gap: '8px', borderBottom: '1px solid rgba(20,83,45,0.14)', paddingBottom: '10px', marginBottom: '16px' },
  tabBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px',
    border: 'none', background: 'transparent', color: 'var(--color-charcoal-soft)', fontSize: '13.5px',
    fontWeight: 600, cursor: 'pointer',
  },
  tabBtnActive: { background: 'var(--color-sage)', color: 'var(--color-forest)', fontWeight: 700 },
  quickSection: { marginBottom: '16px' },
  sectionHeading: { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' },
  quickCard: {
    padding: '10px', borderRadius: '10px', border: '1px solid rgba(20,83,45,0.12)', background: 'var(--color-cream)',
    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
  },
  quickCardTitle: { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-forest)' },
  quickCardDept: { fontSize: '11px', color: 'var(--color-charcoal-soft)', marginTop: '2px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  fieldLabel: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' },
  input: {
    width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.22)',
    fontSize: '13.5px', fontFamily: 'inherit',
  },
  select: {
    width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.22)',
    fontSize: '13.5px', fontFamily: 'inherit', background: '#fff',
  },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.22)',
    fontSize: '13.5px', fontFamily: 'inherit', resize: 'vertical',
  },
  voiceBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px',
    border: '1px solid rgba(20,83,45,0.2)', background: 'var(--color-sage)', color: 'var(--color-forest)',
    fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
  },
  voiceBtnActive: { background: '#d64545', color: '#fff', borderColor: '#d64545' },
  submitBtn: {
    marginTop: '16px', width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
    background: 'var(--color-forest)', color: 'var(--color-cream)', fontSize: '14.5px', fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
  resultView: {
    background: '#fafaf9', padding: '18px', borderRadius: '12px', border: '1px solid #e7e5e4',
  },
  resultHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
    gap: '8px', borderBottom: '1px solid #e7e5e4', paddingBottom: '12px', marginBottom: '14px',
  },
  tokenBadge: {
    fontSize: '12px', fontWeight: 800, background: 'var(--color-sage)', color: 'var(--color-forest)',
    padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace',
  },
  urgencyBadge: {
    fontSize: '11px', fontWeight: 700, background: '#fee2e2', color: '#991b1b',
    padding: '2px 8px', borderRadius: '999px',
  },
  slaBadge: {
    fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#92400e',
    padding: '2px 8px', borderRadius: '999px',
  },
  classificationGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px',
    marginBottom: '14px',
  },
  classItem: {
    background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  },
  classLabel: { fontSize: '11px', color: 'var(--color-charcoal-soft)', textTransform: 'uppercase', fontWeight: 600 },
  classVal: { fontSize: '13px', fontWeight: 700, color: 'var(--color-forest)', marginTop: '2px' },
  noticeBox: {
    background: '#fef3c7', color: '#78350f', padding: '10px 14px', borderRadius: '8px',
    fontSize: '12.5px', lineHeight: 1.45, border: '1px solid #fde68a', marginBottom: '14px',
  },
  petitionPre: {
    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px',
    fontSize: '12.5px', lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap',
    maxHeight: '260px', overflowY: 'auto', color: '#1e293b',
  },
  actionBtnSmall: {
    padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#334155',
  },
  resetBtn: {
    padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff',
    color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  trackInputRow: { display: 'flex', gap: '8px', marginBottom: '16px' },
  trackInput: {
    flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.22)',
    fontSize: '13.5px', fontFamily: 'inherit',
  },
  trackBtn: {
    padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--color-forest)',
    color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  errorText: { color: '#b91c1c', fontSize: '12.5px', marginBottom: '12px' },
  statusCard: {
    background: '#ffffff', borderRadius: '12px', border: '1.5px solid #bbf7d0',
    padding: '16px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.08)', marginBottom: '18px',
  },
  statusCardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px',
    flexWrap: 'wrap', gap: '10px',
  },
  statusSubject: { margin: '6px 0 2px', fontSize: '16px', color: '#0f172a', fontWeight: 700 },
  statusSub: { fontSize: '12px', color: '#64748b' },
  liveStatusPill: {
    fontSize: '12px', fontWeight: 800, background: '#dcfce7', color: '#15803d',
    padding: '4px 10px', borderRadius: '999px', display: 'inline-block',
  },
  timeline: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', position: 'relative',
  },
  timelineStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 },
  stepCircle: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
  },
  stepCircleDone: { background: 'var(--color-forest)', color: '#fff' },
  stepTitle: { fontSize: '11px', color: '#475569', fontWeight: 600, textAlign: 'center' },
  stepLine: { flex: 1, height: '3px', background: '#e2e8f0', margin: '0 -8px 20px', zIndex: 1 },
  stepLineDone: { background: 'var(--color-forest)' },
  recentList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  recentItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
    background: '#ffffff', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s ease',
  },
  recentStatus: { fontSize: '11px', fontWeight: 700, color: 'var(--color-forest)', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' },
}
