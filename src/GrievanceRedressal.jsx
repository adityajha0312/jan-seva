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
  const [activeTab, setActiveTab] = useState('lodge')
  const [applicantName, setApplicantName] = useState(defaultProfile?.name || '')
  const [mobileNumber, setMobileNumber] = useState('')
  const [district, setDistrict] = useState(defaultProfile?.location || 'Bhopal')
  const [tehsilWard, setTehsilWard] = useState('')
  const [grievanceText, setGrievanceText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatedPetition, setGeneratedPetition] = useState(null)
  const [trackTokenInput, setTrackTokenInput] = useState('')
  const [trackedResult, setTrackedResult] = useState(null)
  const [trackError, setTrackError] = useState(null)
  const [trackedList, setTrackedList] = useState(DEFAULT_TRACKED_COMPLAINTS)
  const [copied, setCopied] = useState(false)
  const listenRef = useRef(null)

  function handleVoiceInput() {
    if (isListening) {
      listenRef.current?.stop()
      setIsListening(false)
      return
    }
    stopSpeaking()
    setIsListening(true)
    listenRef.current = startListening({
      lang: 'hi-IN',
      onResult: (transcript, isFinal) => {
        setGrievanceText((prev) => (isFinal ? (prev ? prev + ' ' : '') + transcript : transcript))
        if (isFinal) setIsListening(false)
      },
      onEnd: () => setIsListening(false),
      onError: () => setIsListening(false)
    })
  }

  async function handleAnalyzeAndDraft() {
    if (!grievanceText.trim()) return

    setAnalyzing(true)
    const token = `MP-CMH-2026-${Math.floor(10000 + Math.random() * 90000)}`

    const prompt = `You are the AI Citizen Grievance Redressal Assistant for Madhya Pradesh CM Helpline (181) and Public Service Guarantee Act (Lok Sewa Guarantee Kanoon).
Analyze this citizen's grievance:
"${grievanceText}"
Citizen Details:
Name: ${applicantName || 'Citizen'}
District: ${district}
Tehsil/Ward: ${tehsilWard || 'Unspecified'}

Generate a formal response in JSON format with NO markdown formatting, matching this exact schema:
{
  "department": "The exact MP government department responsible",
  "category": "Short classification",
  "urgency": "High | Medium | Routine",
  "slaDays": 7,
  "summary": "Clear 2-sentence summary of the core grievance under MP Public Service Guarantee Act 2010",
  "formalPetition": "Complete, officially worded petition formatted for the District Collector / Sub-Divisional Magistrate (SDM) in professional Hindi or English.",
  "recommendedAction": "Actionable next steps for the citizen."
}`

    try {
      if (isCurrentlyOnline()) {
        const raw = await askGemini(
          'You are an expert GovTech grievance officer. Respond ONLY with valid raw JSON.',
          [{ role: 'user', text: prompt }],
          true
        )
        const parsed = JSON.parse(raw)
        const finalPetition = {
          token,
          applicant: applicantName || 'Citizen of MP',
          mobile: mobileNumber || '98XXXXXXXX',
          district,
          tehsilWard,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          ...parsed
        }
        setGeneratedPetition(finalPetition)
        setTrackedList((prev) => [
          {
            token,
            applicant: finalPetition.applicant,
            district,
            dept: finalPetition.department,
            subject: finalPetition.category,
            status: 'Lodged (Under Scrutiny)',
            step: 1,
            date: finalPetition.date,
            slaDate: `Within ${finalPetition.slaDays || 7} Days SLA`,
            officer: `District Nodal Officer (${district})`
          },
          ...prev
        ])
      } else {
        throw new Error('Offline fallback')
      }
    } catch {
      const fallback = {
        token,
        applicant: applicantName || 'Shri/Smt. Citizen',
        mobile: mobileNumber || '98260XXXXX',
        district,
        tehsilWard: tehsilWard || 'Gram Panchayat Center',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        department: grievanceText.toLowerCase().includes('ration') || grievanceText.toLowerCase().includes('bpl')
          ? 'Food, Civil Supplies and Consumer Protection Dept.'
          : grievanceText.toLowerCase().includes('kisan') || grievanceText.toLowerCase().includes('land')
          ? 'Revenue Department (Collectorate / Tehsil)'
          : 'Panchayat & Rural Development Department',
        category: 'Citizen Public Service Grievance',
        urgency: 'High',
        slaDays: 7,
        summary: `Grievance submitted regarding public service delivery failure in ${district}. Citizen alleges delay exceeding the statutory time limit under Madhya Pradesh Public Services Guarantee Act 2010.`,
        formalPetition: `To,\nThe District Magistrate / Sub-Divisional Officer (SDM)\nDistrict ${district}, Government of Madhya Pradesh\n\nSUBJECT: Formal Representation & Grievance under MP CM Helpline 181 and Lok Sewa Guarantee Act.\n\nRespected Sir/Madam,\n\nI, ${applicantName || 'Applicant'}, resident of ${tehsilWard || 'Tehsil/Ward'}, District ${district}, submit this formal grievance regarding:\n"${grievanceText}"\n\nDespite repeated submissions at the local panchayat/block level, no redressal has been provided within the designated timeline stipulated under the Public Service Guarantee Act 2010.\n\nRELIEF PRAYED FOR:\n1. Immediate inquiry and directive to the concerned nodal department.\n2. Redressal of service deficit within the mandated 7-day SLA.\n3. Intimation of action taken report via SMS to ${mobileNumber || 'registered mobile'}.\n\nYours faithfully,\n${applicantName || 'Citizen Applicant'}\nDate: ${new Date().toLocaleDateString('en-IN')}`,
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.badge}>GovTech · CM Helpline 181</span>
            <h2 style={styles.title}>AI Citizen Grievance Redressal</h2>
            <p style={styles.subtitle}>
              Voice or text grievance drafting with auto-classification under the MP Public Service Guarantee Act.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>

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

        {activeTab === 'lodge' && (
          <div>
            {!generatedPetition ? (
              <>
                <div style={styles.quickSection}>
                  <div style={styles.sectionHeading}>Common MP Public Service Grievance Templates:</div>
                  <div style={styles.quickGrid}>
                    {QUICK_GRIEVANCE_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.title}
                        style={styles.quickCard}
                        onClick={() => setGrievanceText(tmpl.desc)}
                      >
                        <div style={styles.quickCardTitle}>{tmpl.title}</div>
                        <div style={styles.quickCardDept}>{tmpl.dept}</div>
                      </button>
                    ))}
                  </div>
                </div>

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
                      placeholder="e.g. Ichhawar / Ward No. 12"
                      value={tehsilWard}
                      onChange={(e) => setTehsilWard(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={styles.fieldLabel}>Describe the Grievance / Problem</label>
                    {isVoiceInputSupported && (
                      <button
                        type="button"
                        onClick={handleVoiceInput}
                        style={{
                          ...styles.voiceBtn,
                          ...(isListening ? styles.voiceBtnActive : {})
                        }}
                      >
                        {isListening ? <StopIcon size={14} color="#fff" /> : <MicIcon size={14} color="var(--color-forest)" />}
                        <span>{isListening ? 'Listening...' : 'Speak in Hindi/English'}</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    style={styles.textarea}
                    rows={4}
                    placeholder="Describe what happened, which office is causing delay, or speak freely in your language..."
                    value={grievanceText}
                    onChange={(e) => setGrievanceText(e.target.value)}
                  />
                </div>

                <button
                  className="ym-cta"
                  style={styles.submitBtn}
                  onClick={handleAnalyzeAndDraft}
                  disabled={analyzing || !grievanceText.trim()}
                >
                  {analyzing ? 'AI Analyzing Department & Generating Petition...' : 'Generate Official CM Helpline Petition & Token →'}
                </button>
              </>
            ) : (
              <div style={styles.petitionResult}>
                <div style={styles.successBar}>
                  <div>
                    <span style={styles.tokenPill}>Token: {generatedPetition.token}</span>
                    <strong style={{ marginLeft: '10px', color: 'var(--color-forest)', fontSize: '15px' }}>
                      Grievance Formally Registered
                    </strong>
                  </div>
                  <div style={styles.slaBadge}>SLA: {generatedPetition.slaDays || 7} Working Days</div>
                </div>

                <div style={styles.classificationGrid}>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Assigned Department</div>
                    <div style={styles.classValue}>{generatedPetition.department}</div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Grievance Category</div>
                    <div style={styles.classValue}>{generatedPetition.category}</div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Priority & Urgency</div>
                    <div style={{ ...styles.classValue, color: generatedPetition.urgency === 'High' ? '#b00020' : 'var(--color-forest)' }}>
                      {generatedPetition.urgency} Urgency
                    </div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>District Nodal Office</div>
                    <div style={styles.classValue}>Collectorate, {generatedPetition.district}</div>
                  </div>
                </div>

                <div style={styles.memoContainer}>
                  <div style={styles.memoHeader}>
                    <span>GOVERNMENT OF MADHYA PRADESH · CM HELPLINE 181 PETITION</span>
                    <button style={styles.copyBtn} onClick={handleCopyPetition}>
                      {copied ? '✓ Copied!' : 'Copy Petition'}
                    </button>
                  </div>
                  <pre style={styles.memoContent}>{generatedPetition.formalPetition}</pre>
                </div>

                {generatedPetition.recommendedAction && (
                  <div style={styles.actionNote}>
                    <strong>Next Steps for Citizen:</strong> {generatedPetition.recommendedAction}
                  </div>
                )}

                <div style={styles.resultActions}>
                  <button className="ym-cta" style={styles.printBtn} onClick={handlePrintPetition}>
                    🖨️ Print / Save Official PDF
                  </button>
                  <button
                    style={styles.newGrievanceBtn}
                    onClick={() => {
                      setGeneratedPetition(null)
                      setGrievanceText('')
                    }}
                  >
                    Lodge Another Grievance
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'track' && (
          <div style={styles.trackSection}>
            <div style={styles.trackSearchRow}>
              <input
                style={styles.trackInput}
                placeholder="Enter Token ID (e.g. MP-CMH-2026-89421)"
                value={trackTokenInput}
                onChange={(e) => setTrackTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrackLookup()}
              />
              <button className="ym-cta" style={styles.trackBtn} onClick={handleTrackLookup}>
                Track Status
              </button>
            </div>

            {trackError && <div style={styles.trackError}>{trackError}</div>}

            {trackedResult && (
              <div style={styles.trackCard}>
                <div style={styles.trackCardHead}>
                  <div>
                    <span style={styles.tokenPill}>{trackedResult.token}</span>
                    <h3 style={{ margin: '6px 0 0', color: 'var(--color-forest)', fontSize: '16px' }}>
                      {trackedResult.subject}
                    </h3>
                  </div>
                  <span style={styles.statusPill}>{trackedResult.status}</span>
                </div>

                <div style={styles.trackDetailsGrid}>
                  <div><strong>Applicant:</strong> {trackedResult.applicant}</div>
                  <div><strong>District:</strong> {trackedResult.district}</div>
                  <div><strong>Department:</strong> {trackedResult.dept}</div>
                  <div><strong>Assigned Officer:</strong> {trackedResult.officer}</div>
                  <div><strong>Date Filed:</strong> {trackedResult.date}</div>
                  <div><strong>Target SLA:</strong> {trackedResult.slaDate}</div>
                </div>

                <div style={styles.timelineWrap}>
                  <div style={styles.timelineStep}>
                    <div style={{ ...styles.stepCircle, ...(trackedResult.step >= 1 ? styles.stepCircleDone : {}) }}>1</div>
                    <div style={styles.stepTitle}>Lodged</div>
                  </div>
                  <div style={{ ...styles.stepLine, ...(trackedResult.step >= 2 ? styles.stepLineDone : {}) }} />
                  <div style={styles.timelineStep}>
                    <div style={{ ...styles.stepCircle, ...(trackedResult.step >= 2 ? styles.stepCircleDone : {}) }}>2</div>
                    <div style={styles.stepTitle}>AI Classified & Routed</div>
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
    position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.48)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', zIndex: 60, backdropFilter: 'blur(3px)',
  },
  modal: {
    background: '#ffffff', borderRadius: '16px', padding: '24px',
    maxWidth: '720px', width: '100%', maxHeight: '92vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)', boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  headerLeft: { flex: 1, paddingRight: '12px' },
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
  petitionResult: { animation: 'ym-rise 0.25s ease-out' },
  successBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px',
    background: 'var(--color-sage)', borderRadius: '10px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px',
  },
  tokenPill: {
    background: 'var(--color-forest)', color: '#fff', padding: '4px 9px', borderRadius: '6px',
    fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
  },
  slaBadge: {
    background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '999px',
    fontSize: '12px', fontWeight: 700,
  },
  classificationGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px',
    marginBottom: '14px',
  },
  classItem: { background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  classLabel: { fontSize: '11px', color: 'var(--color-charcoal-soft)', fontWeight: 600 },
  classValue: { fontSize: '13px', color: 'var(--color-forest)', fontWeight: 700, marginTop: '3px' },
  memoContainer: {
    border: '1px solid rgba(20,83,45,0.2)', borderRadius: '10px', background: '#fafaf9',
    overflow: 'hidden', marginBottom: '14px',
  },
  memoHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px',
    background: 'rgba(20,83,45,0.08)', fontSize: '11px', fontWeight: 700, color: 'var(--color-forest)',
  },
  copyBtn: {
    padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(20,83,45,0.2)',
    background: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
  },
  memoContent: {
    padding: '12px', margin: 0, fontSize: '12.5px', lineHeight: 1.5, whiteSpace: 'pre-wrap',
    fontFamily: 'monospace', color: '#1e293b', maxHeight: '240px', overflowY: 'auto',
  },
  actionNote: {
    background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '10px 12px',
    fontSize: '12.5px', color: '#713f12', marginBottom: '14px',
  },
  resultActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  printBtn: {
    flex: '1 1 200px', padding: '11px', borderRadius: '8px', border: 'none',
    background: 'var(--color-forest)', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
  },
  newGrievanceBtn: {
    flex: '1 1 160px', padding: '11px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.25)',
    background: '#fff', color: 'var(--color-forest)', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
  },
  trackSection: { animation: 'ym-rise 0.25s ease-out' },
  trackSearchRow: { display: 'flex', gap: '8px', marginBottom: '14px' },
  trackInput: {
    flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.22)',
    fontSize: '14px', fontFamily: 'inherit',
  },
  trackBtn: {
    padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--color-forest)',
    color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
  },
  trackError: { color: '#b00020', fontSize: '12.5px', marginBottom: '12px' },
  trackCard: {
    border: '1px solid rgba(20,83,45,0.18)', borderRadius: '12px', padding: '16px', background: '#fafaf9',
    marginBottom: '16px',
  },
  trackCardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  statusPill: {
    background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '999px',
    fontSize: '12px', fontWeight: 700,
  },
  trackDetailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '12.5px', color: '#334155' },
  timelineWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px',
    padding: '12px 10px 4px', borderTop: '1px solid #e2e8f0',
  },
  timelineStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center', minWidth: '60px' },
  stepCircle: {
    width: '26px', height: '26px', borderRadius: '50%', background: '#cbd5e1', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5px', fontWeight: 700,
  },
  stepCircleDone: { background: 'var(--color-forest)' },
  stepTitle: { fontSize: '10.5px', fontWeight: 600, color: 'var(--color-charcoal)' },
  stepLine: { flex: 1, height: '3px', background: '#cbd5e1', margin: '0 4px', transform: 'translateY(-10px)' },
  stepLineDone: { background: 'var(--color-forest)' },
  recentList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  recentItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px',
    borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', textAlign: 'left',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  recentStatus: { fontSize: '11px', fontWeight: 700, color: 'var(--color-forest)', background: 'var(--color-sage)', padding: '3px 8px', borderRadius: '999px' },
}
