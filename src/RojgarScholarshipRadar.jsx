import { useState, useMemo } from 'react'
import {
  CloseIcon, ArrowRightIcon, CheckCircleIcon, ExternalLinkIcon, SparklesIcon,
  BriefcaseJobIcon, EducationIcon, FemaleIcon, MaleIcon, SearchIcon, DocumentIcon,
} from './Icons'

// 8 Flagship MP Govt Scholarships, Stipends, and Direct Recruitment Exams
const OPPORTUNITIES_DATABASE = [
  {
    id: 'mmsky',
    title: 'Mukhyamantri Seekho-Kamao Yojana (MMSKY)',
    hindiTitle: 'मुख्यमंत्री सीखो-कमाओ योजना',
    type: 'stipend',
    typeLabel: 'Skill Training Stipend',
    dept: 'MP State Skill Development & Employment Board',
    benefit: '₹8,000 - ₹10,000 / month Direct Bank Transfer (DBT)',
    benefitShort: '₹10,000/mo Stipend',
    color: '#d97706',
    portalUrl: 'https://mmsky.mp.gov.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isAgeOk = p.age >= 18 && p.age <= 29
      const isQualOk = ['12th', 'iti_diploma', 'graduate', 'post_graduate'].includes(p.qual)
      const isDomicileOk = p.domicile

      if (isDomicileOk) { checks.push({ text: 'Permanent Resident / Domicile of Madhya Pradesh', ok: true }); score += 25 }
      else checks.push({ text: 'MP Domicile certificate required', ok: false })

      if (isAgeOk) { checks.push({ text: `Age ${p.age} is within eligible bracket (18 - 29 years)`, ok: true }); score += 35 }
      else checks.push({ text: 'Age must be between 18 and 29 years', ok: false })

      if (isQualOk) {
        let stipend = '₹8,000/mo'
        if (p.qual === 'iti_diploma') stipend = '₹8,500/mo'
        else if (p.qual === 'graduate' || p.qual === 'post_graduate') stipend = '₹10,000/mo'
        checks.push({ text: `Educational qualification (${p.qual.toUpperCase()}) entitled to ${stipend}`, ok: true })
        score += 40
      } else {
        checks.push({ text: 'Requires minimum 12th Pass, ITI, Diploma or Degree', ok: false })
      }

      return {
        score,
        checks,
        requiredDocs: ['Samagra ID (e-KYC completed)', '12th / ITI / Degree Marksheet', 'Aadhaar-linked Bank Account', 'MP Rojgar Panjiyan Registration'],
      }
    },
  },
  {
    id: 'mmvy',
    title: 'Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)',
    hindiTitle: 'मुख्यमंत्री मेधावी विद्यार्थी योजना',
    type: 'scholarship',
    typeLabel: 'Higher Education Scholarship',
    dept: 'Department of Higher Education, Govt of MP',
    benefit: '100% Full College Tuition Fees Paid by MP Govt',
    benefitShort: '100% Tuition Waiver',
    color: '#0284c7',
    portalUrl: 'https://scholarshipportal.mp.nic.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isDomicileOk = p.domicile
      const isIncomeOk = p.income !== 'high' // <= 6 Lakhs
      const isScoreOk = p.boardScore >= 70 // >= 70% MP Board or >= 85% CBSE

      if (isDomicileOk) { checks.push({ text: 'Madhya Pradesh domicile verified', ok: true }); score += 20 }
      else checks.push({ text: 'Must have MP Domicile Certificate', ok: false })

      if (isScoreOk) {
        checks.push({ text: `12th Board Score (${p.boardScore}%) meets merit threshold (≥70% MP Board)`, ok: true })
        score += 45
      } else {
        checks.push({ text: `Score ${p.boardScore}% is below the 70% merit threshold for MMVY`, ok: false })
      }

      if (isIncomeOk) {
        checks.push({ text: 'Annual family income is within the ₹6.0 Lakh/year ceiling', ok: true })
        score += 35
      } else {
        checks.push({ text: 'Family annual income exceeds ₹6 Lakh limit', ok: false })
      }

      return {
        score,
        checks,
        requiredDocs: ['12th Class Marksheet', 'Income Certificate (< ₹6 Lakh/yr)', 'MP Domicile Certificate', 'College Admission Allotment Letter'],
      }
    },
  },
  {
    id: 'post_matric',
    title: 'MP Post-Matric Scholarship (SC / ST / OBC)',
    hindiTitle: 'मध्य प्रदेश पोस्ट-मैट्रिक छात्रवृत्ति योजना',
    type: 'scholarship',
    typeLabel: 'State Welfare Scholarship',
    dept: 'Tribal Welfare & Backward Classes Dept, MP',
    benefit: '₹3,000 - ₹15,000 / year + Full Government College Fee Reimbursement',
    benefitShort: 'Fee Waiver + Maintenance Aid',
    color: '#059669',
    portalUrl: 'https://scholarshipportal.mp.nic.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isCategoryEligible = ['obc', 'sc', 'st'].includes(p.category)
      const isQualOk = ['12th', 'iti_diploma', 'graduate', 'post_graduate'].includes(p.qual)
      const isIncomeOk = p.income === 'low' || (p.income === 'medium' && ['sc', 'st'].includes(p.category))

      if (isCategoryEligible) {
        checks.push({ text: `Reserved Category applicant (${p.category.toUpperCase()}) entitled to quota`, ok: true })
        score += 40
      } else {
        checks.push({ text: 'General category excluded (Available for SC/ST/OBC applicants)', ok: false })
      }

      if (isIncomeOk) {
        checks.push({ text: 'Family income meets state post-matric poverty criteria', ok: true })
        score += 30
      } else {
        checks.push({ text: 'Income limit for OBC is ₹3 Lakh; SC/ST limit is ₹6 Lakh', ok: false })
      }

      if (isQualOk) {
        checks.push({ text: 'Enrolled in recognized post-secondary diploma or college course', ok: true })
        score += 30
      } else {
        checks.push({ text: 'Requires enrollment post Class 10th or 12th', ok: false })
      }

      return {
        score,
        checks,
        requiredDocs: ['Digital Caste Certificate', 'Samagra Member ID', 'Previous Year Marksheet', 'Fee Receipt & College Bonafide'],
      }
    },
  },
  {
    id: 'gaon_ki_beti',
    title: 'Gaon Ki Beti & Pratibha Kiran Yojana',
    hindiTitle: 'गाँव की बेटी एवं प्रतिभा किरण योजना',
    type: 'scholarship',
    typeLabel: 'Girls Higher Education Grant',
    dept: 'Department of Higher Education, MP',
    benefit: '₹5,000 / year (₹500 / month for 10 academic months)',
    benefitShort: '₹5,000/yr Cash Grant',
    color: '#e11d48',
    portalUrl: 'https://highereducation.mp.gov.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isFemale = p.gender === 'female'
      const isScoreOk = p.boardScore >= 60
      const isQualOk = ['12th', 'graduate', 'post_graduate'].includes(p.qual)

      if (isFemale) { checks.push({ text: 'Female candidate resident in MP village/town', ok: true }); score += 40 }
      else checks.push({ text: 'Scheme is exclusively for female students', ok: false })

      if (isScoreOk) { checks.push({ text: `Passed Class 12th with 1st Division (${p.boardScore}% ≥ 60%)`, ok: true }); score += 40 }
      else checks.push({ text: 'Requires minimum 1st Division (60%) in Class 12th', ok: false })

      if (isQualOk && p.domicile) { checks.push({ text: 'Eligible for higher education continuing enrollment grant', ok: true }); score += 20 }
      else checks.push({ text: 'Requires active college enrollment in MP', ok: false })

      return {
        score,
        checks,
        requiredDocs: ['12th Marksheet with 1st Div', 'Village Residency Certificate (Gaon Ki Beti)', 'Samagra ID', 'Bank Passbook'],
      }
    },
  },
  {
    id: 'esb_police',
    title: 'MP Police Constable & Sub-Inspector Recruitment',
    hindiTitle: 'मध्य प्रदेश पुलिस आरक्षक एवं उप-निरीक्षक भर्ती (ESB)',
    type: 'job',
    typeLabel: 'Govt Direct Recruitment',
    dept: 'MP Employees Selection Board (ESB / Vyapam)',
    benefit: '₹19,500 - ₹62,000 / month (Pay Scale Level 4 / 6) + Govt Perks',
    benefitShort: '₹19.5k - ₹62k/mo Salary',
    color: '#0284c7',
    portalUrl: 'https://esb.mp.gov.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      // Age relaxation: General 18-33; OBC/SC/ST/Female 18-38
      const maxAge = p.category !== 'general' || p.gender === 'female' ? 38 : 33
      const isAgeOk = p.age >= 18 && p.age <= maxAge
      const isQualOk = ['10th', '12th', 'iti_diploma', 'graduate', 'post_graduate'].includes(p.qual)

      if (isQualOk) {
        checks.push({ text: 'Meets minimum educational threshold (Class 10th/12th Pass)', ok: true })
        score += 45
      } else {
        checks.push({ text: 'Requires minimum Class 10th pass certificate', ok: false })
      }

      if (isAgeOk) {
        const note = maxAge > 33 ? ` (Includes +5 yrs reservation relaxation for ${p.category.toUpperCase()})` : ''
        checks.push({ text: `Age ${p.age} is within eligible limit (18 - ${maxAge} yrs)${note}`, ok: true })
        score += 35
      } else {
        checks.push({ text: `Age ${p.age} exceeds the maximum recruitment limit of ${maxAge} years`, ok: false })
      }

      if (p.domicile) { checks.push({ text: 'MP Domicile state recruitment quota applicable', ok: true }); score += 20 }
      else checks.push({ text: 'Non-domicile treated under unreserved open quota only', ok: false })

      return {
        score,
        checks,
        requiredDocs: ['MP Rojgar Panjiyan (Active)', '10th & 12th Board Marksheet', 'Aadhaar Card', 'Physical Fitness Standard Declaration'],
      }
    },
  },
  {
    id: 'esb_patwari',
    title: 'MP Patwari & Revenue Staff (ESB Group 2)',
    hindiTitle: 'मध्य प्रदेश पटवारी एवं राजस्व सहायक भर्ती',
    type: 'job',
    typeLabel: 'Govt Administrative Cadre',
    dept: 'MP Land Records Department via ESB',
    benefit: '₹25,300 - ₹80,500 / month (Pay Scale Level 5) + Pension',
    benefitShort: '₹25.3k - ₹80.5k/mo Salary',
    color: '#7c3aed',
    portalUrl: 'https://esb.mp.gov.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isGrad = ['graduate', 'post_graduate'].includes(p.qual)
      const maxAge = p.category !== 'general' || p.gender === 'female' ? 45 : 40
      const isAgeOk = p.age >= 18 && p.age <= maxAge

      if (isGrad) {
        checks.push({ text: 'Holds Bachelor Degree (Graduate) required for Patwari cadre', ok: true })
        score += 50
      } else {
        checks.push({ text: 'Requires Bachelor Degree (Graduation) in any stream', ok: false })
      }

      if (isAgeOk) {
        checks.push({ text: `Age ${p.age} is within eligible window (18 - ${maxAge} years)`, ok: true })
        score += 30
      } else {
        checks.push({ text: `Age ${p.age} exceeds maximum recruitment age limit of ${maxAge} years`, ok: false })
      }

      if (p.domicile) { checks.push({ text: 'Eligible for district-wise MP Revenue allocation quota', ok: true }); score += 20 }
      else checks.push({ text: 'Must register on MP Rojgar Portal', ok: false })

      return {
        score,
        checks,
        requiredDocs: ['Graduation Degree Marksheet', 'CPCT Scorecard (or 3-yr undertaking)', 'MP Rojgar Panjiyan', 'Domicile & Samagra ID'],
      }
    },
  },
  {
    id: 'esb_forest',
    title: 'MP Forest Guard (Vanrakshak) & Jail Prahari',
    hindiTitle: 'मध्य प्रदेश वनरक्षक एवं जेल प्रहरी भर्ती',
    type: 'job',
    typeLabel: 'Govt Field Enforcement',
    dept: 'MP Forest Department / Jail Department',
    benefit: '₹19,500 - ₹62,000 / month + Uniform & Field Allowances',
    benefitShort: '₹19.5k - ₹62k/mo Salary',
    color: '#059669',
    portalUrl: 'https://esb.mp.gov.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isQualOk = ['10th', '12th', 'iti_diploma', 'graduate', 'post_graduate'].includes(p.qual)
      const maxAge = p.category !== 'general' || p.gender === 'female' ? 38 : 33
      const isAgeOk = p.age >= 18 && p.age <= maxAge

      if (isQualOk) {
        checks.push({ text: '10th/12th High School certification verified', ok: true })
        score += 45
      } else {
        checks.push({ text: 'Requires minimum Class 10th pass', ok: false })
      }

      if (isAgeOk) {
        checks.push({ text: `Age ${p.age} meets field recruitment criteria (18 - ${maxAge} yrs)`, ok: true })
        score += 35
      } else {
        checks.push({ text: `Exceeds upper age limit of ${maxAge} years`, ok: false })
      }

      if (p.domicile) { checks.push({ text: 'MP district forest circle allocation eligible', ok: true }); score += 20 }
      else checks.push({ text: 'MP Domicile certificate required for reservation', ok: false })

      return {
        score,
        checks,
        requiredDocs: ['10th Board Marksheet', 'MP Employment Exchange Registration', 'Aadhaar Card', 'Caste Certificate (if claiming age relief)'],
      }
    },
  },
  {
    id: 'udyam_kranti',
    title: 'Mukhyamantri Udyam Kranti Yojana (Youth Entrepreneurship)',
    hindiTitle: 'मुख्यमंत्री उद्यम क्रांति योजना (स्वरोज़गार)',
    type: 'stipend',
    typeLabel: 'Youth Startup Loan & Subsidy',
    dept: 'Department of MSME, Govt of MP',
    benefit: '₹1 Lakh - ₹50 Lakh Collateral-Free Bank Loan + 3% Interest Subsidy',
    benefitShort: 'Up to ₹50L Loan Subsidy',
    color: '#d97706',
    portalUrl: 'https://msme.mponline.gov.in',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isQualOk = ['12th', 'iti_diploma', 'graduate', 'post_graduate'].includes(p.qual)
      const isAgeOk = p.age >= 18 && p.age <= 45
      const isIncomeOk = p.income !== 'high'

      if (isQualOk) {
        checks.push({ text: 'Completed minimum Class 12th required for enterprise loan', ok: true })
        score += 40
      } else {
        checks.push({ text: 'Requires Class 12th pass minimum for business scheme', ok: false })
      }

      if (isAgeOk) {
        checks.push({ text: `Age ${p.age} qualifies for young entrepreneur bracket (18 - 45 yrs)`, ok: true })
        score += 35
      } else {
        checks.push({ text: 'Must be between 18 and 45 years', ok: false })
      }

      if (isIncomeOk) {
        checks.push({ text: 'Family annual income under ₹12 Lakh statutory cap', ok: true })
        score += 25
      } else {
        checks.push({ text: 'Annual family income exceeds maximum ceiling', ok: false })
      }

      return {
        score,
        checks,
        requiredDocs: ['Project Detailed Project Report (DPR)', '12th Marksheet', 'Samagra ID', 'Aadhaar & PAN Card'],
      }
    },
  },
]

const QUICK_PRESETS = [
  {
    label: '12th Pass Science (PCM)',
    icon: '🔬',
    profile: { qual: '12th', category: 'obc', age: 19, boardScore: 78, income: 'low', gender: 'male', domicile: true },
  },
  {
    label: 'College Graduate (BA/BSc)',
    icon: '🎓',
    profile: { qual: 'graduate', category: 'general', age: 23, boardScore: 68, income: 'medium', gender: 'male', domicile: true },
  },
  {
    label: 'Technical Diploma / ITI',
    icon: '⚙️',
    profile: { qual: 'iti_diploma', category: 'sc', age: 21, boardScore: 65, income: 'low', gender: 'male', domicile: true },
  },
  {
    label: 'Rural Female Student',
    icon: '👩‍🎓',
    profile: { qual: '12th', category: 'obc', age: 18, boardScore: 74, income: 'low', gender: 'female', domicile: true },
  },
]

export default function RojgarScholarshipRadar({ onClose, onStartChat }) {
  const [profile, setProfile] = useState({
    qual: '12th',
    category: 'obc',
    age: 20,
    boardScore: 74,
    income: 'low', // low (<1.5L), medium (1.5-6L), high (>6L)
    gender: 'male',
    domicile: true,
  })

  const [activeTab, setActiveTab] = useState('all') // 'all', 'scholarship', 'job', 'stipend'
  const [expandedId, setExpandedId] = useState('mmsky')
  const [copiedDocId, setCopiedDocId] = useState(null)

  // Evaluate all opportunities dynamically
  const evaluations = useMemo(() => {
    return OPPORTUNITIES_DATABASE.map((opp) => {
      const result = opp.evaluate(profile)
      return {
        ...opp,
        ...result,
      }
    }).sort((a, b) => b.score - a.score)
  }, [profile])

  const filteredOpportunities = useMemo(() => {
    if (activeTab === 'all') return evaluations
    return evaluations.filter((opp) => opp.type === activeTab)
  }, [evaluations, activeTab])

  const highMatchCount = evaluations.filter((o) => o.score >= 70).length

  function handleCopyChecklist(opp) {
    const text = `Document Checklist for ${opp.title}:\n- ` + opp.requiredDocs.join('\n- ')
    navigator.clipboard?.writeText(text)
    setCopiedDocId(opp.id)
    setTimeout(() => setCopiedDocId(null), 2500)
  }

  function handleApplyInChat(opp) {
    onClose()
    if (onStartChat) {
      onStartChat(
        `I am a ${profile.age} year old ${profile.category.toUpperCase()} candidate with ${profile.qual.toUpperCase()} qualification (${profile.boardScore}% score). Guide me step-by-step to apply for ${opp.title} (${opp.hindiTitle}).`
      )
    }
  }

  return (
    <div className="ym-modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="ym-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>Government of Madhya Pradesh · Youth Portal</span>
              <span style={styles.pulseLive}>● AI REAL-TIME RADAR</span>
            </div>
            <h2 style={styles.title}>AI Sarkari Rojgar & Scholarship Radar</h2>
            <p style={styles.subtitle}>
              Instant algorithmic matching for MP Government Recruitments (ESB), Merit Scholarships (MMVY / Post-Matric), and Paid Skill Stipends (MMSKY).
            </p>
          </div>
          <button className="ym-close-pill-btn" onClick={onClose} aria-label="Close" title="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div style={styles.summaryBanner}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Matched Opportunities</div>
            <div style={styles.summaryVal}>
              <strong style={{ color: '#059669', fontSize: '22px' }}>{highMatchCount}</strong> / {OPPORTUNITIES_DATABASE.length} High-Match
            </div>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Monthly Skill Stipend</div>
            <div style={styles.summaryVal}>
              <strong style={{ color: '#d97706', fontSize: '20px' }}>Up to ₹10,000 / mo</strong> (MMSKY DBT)
            </div>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Higher Education Tuition Cover</div>
            <div style={styles.summaryVal}>
              <strong style={{ color: '#0284c7', fontSize: '20px' }}>
                {profile.boardScore >= 70 ? '100% Free Tuition' : 'State Fee Waiver'}
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div style={styles.presetSection}>
          <span style={styles.presetLabel}>⚡ Quick Youth Presets:</span>
          <div style={styles.presetGrid}>
            {QUICK_PRESETS.map((p, idx) => (
              <button
                key={idx}
                style={styles.presetBtn}
                onClick={() => setProfile({ ...p.profile })}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="ym-scorecard-grid">
          {/* Left Column: Youth Profile Filters */}
          <div style={styles.filterCol}>
            <div style={styles.filterTitle}>
              <SparklesIcon size={16} color="#059669" />
              <span>Candidate Qualifications:</span>
            </div>

            {/* Educational Qualification */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Highest Education</label>
              <div style={styles.pillRow}>
                {[
                  { id: '10th', label: '10th Pass' },
                  { id: '12th', label: '12th Pass' },
                  { id: 'iti_diploma', label: 'ITI / Diploma' },
                  { id: 'graduate', label: 'Graduate (Degree)' },
                  { id: 'post_graduate', label: 'Post-Graduate' },
                ].map((item) => (
                  <button
                    key={item.id}
                    style={{ ...styles.pillBtn, ...(profile.qual === item.id ? styles.pillBtnActive : {}) }}
                    onClick={() => setProfile((prev) => ({ ...prev, qual: item.id }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reservation Category */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Social Category / Quota</label>
              <div style={styles.pillRow}>
                {[
                  { id: 'general', label: 'General (UR)' },
                  { id: 'obc', label: 'OBC' },
                  { id: 'sc', label: 'SC' },
                  { id: 'st', label: 'ST' },
                  { id: 'ews', label: 'EWS' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    style={{ ...styles.pillBtn, ...(profile.category === cat.id ? styles.pillBtnActive : {}) }}
                    onClick={() => setProfile((prev) => ({ ...prev, category: cat.id }))}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Slider with Relaxation Info */}
            <div style={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={styles.filterLabel}>Age: <strong style={{ color: '#0f172a' }}>{profile.age} years</strong></label>
                <span style={styles.ageRelNote}>
                  {profile.category !== 'general' ? `+5 yrs relaxation applied (${profile.category.toUpperCase()})` : 'Standard age limit'}
                </span>
              </div>
              <input
                type="range"
                min="18"
                max="40"
                value={profile.age}
                onChange={(e) => setProfile((prev) => ({ ...prev, age: parseInt(e.target.value, 10) }))}
                style={styles.slider}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                <span>18 yrs</span>
                <span>25 yrs</span>
                <span>35 yrs</span>
                <span>40 yrs</span>
              </div>
            </div>

            {/* 12th Board Score Slider */}
            <div style={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={styles.filterLabel}>12th Board Score: <strong style={{ color: '#0284c7' }}>{profile.boardScore}%</strong></label>
                {profile.boardScore >= 70 && (
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '5px' }}>
                    🏆 MMVY Eligible (≥70%)
                  </span>
                )}
              </div>
              <input
                type="range"
                min="45"
                max="98"
                value={profile.boardScore}
                onChange={(e) => setProfile((prev) => ({ ...prev, boardScore: parseInt(e.target.value, 10) }))}
                style={styles.slider}
              />
            </div>

            {/* Annual Income */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Annual Family Income</label>
              <div style={styles.pillRow}>
                {[
                  { id: 'low', label: '< ₹1.5 Lakh' },
                  { id: 'medium', label: '₹1.5L - ₹6.0L' },
                  { id: 'high', label: '> ₹6.0 Lakh' },
                ].map((inc) => (
                  <button
                    key={inc.id}
                    style={{ ...styles.pillBtn, ...(profile.income === inc.id ? styles.pillBtnActive : {}) }}
                    onClick={() => setProfile((prev) => ({ ...prev, income: inc.id }))}
                  >
                    {inc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender & MP Domicile */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.filterLabel}>Gender</label>
                <div style={styles.pillRow}>
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      style={{ ...styles.pillBtn, ...(profile.gender === g ? styles.pillBtnActive : {}) }}
                      onClick={() => setProfile((prev) => ({ ...prev, gender: g }))}
                    >
                      {g === 'male' ? <MaleIcon size={14} /> : <FemaleIcon size={14} />}
                      <span style={{ textTransform: 'capitalize' }}>{g}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={styles.filterLabel}>MP Domicile</label>
                <button
                  style={{
                    ...styles.pillBtn,
                    width: '100%',
                    justifyContent: 'center',
                    ...(profile.domicile ? styles.pillBtnActive : {}),
                  }}
                  onClick={() => setProfile((prev) => ({ ...prev, domicile: !prev.domicile }))}
                >
                  {profile.domicile ? '✓ MP Resident' : 'Non-Domicile'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Matched Schemes & Sarkari Recruitment */}
          <div style={styles.resultsCol}>
            {/* Category Filter Tabs */}
            <div style={styles.tabsRow}>
              {[
                { id: 'all', label: `All Opportunities (${evaluations.length})` },
                { id: 'scholarship', label: 'Scholarships (छात्रवृत्ति)' },
                { id: 'job', label: 'Govt Jobs / Exams (भर्ती)' },
                { id: 'stipend', label: 'Skill Stipends (सिक्खो कमाओ)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  style={{ ...styles.tabBtn, ...(activeTab === tab.id ? styles.tabBtnActive : {}) }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Opportunities List */}
            <div style={styles.opportunitiesList}>
              {filteredOpportunities.map((opp) => {
                const isExpanded = expandedId === opp.id
                const isHighMatch = opp.score >= 70

                return (
                  <div
                    key={opp.id}
                    style={{
                      ...styles.oppCard,
                      borderLeft: `4px solid ${opp.color}`,
                      boxShadow: isExpanded ? '0 8px 24px rgba(15, 23, 42, 0.08)' : '0 2px 8px rgba(15, 23, 42, 0.03)',
                    }}
                  >
                    {/* Card Header */}
                    <div style={styles.oppCardTop} onClick={() => setExpandedId(isExpanded ? null : opp.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ ...styles.oppTypeBadge, background: `${opp.color}15`, color: opp.color }}>
                            {opp.typeLabel}
                          </span>
                          <span style={styles.oppDept}>{opp.dept}</span>
                        </div>
                        <h3 style={styles.oppTitle}>{opp.title}</h3>
                        <div style={styles.oppHindi}>{opp.hindiTitle}</div>
                      </div>

                      {/* Score Badge */}
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <div
                          style={{
                            ...styles.scorePill,
                            background: isHighMatch ? '#ecfdf5' : '#f8fafc',
                            color: isHighMatch ? '#059669' : '#64748b',
                            border: `1.5px solid ${isHighMatch ? '#a7f3d0' : '#e2e8f0'}`,
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 800 }}>{opp.score}%</span>
                          <span style={{ fontSize: '10px' }}>{isHighMatch ? 'High Match' : 'Partial'}</span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: opp.color, marginTop: '6px' }}>
                          {opp.benefitShort}
                        </div>
                      </div>
                    </div>

                    {/* Benefit Banner */}
                    <div style={styles.oppBenefitBanner}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>Entitlement: </span>
                      <span>{opp.benefit}</span>
                    </div>

                    {/* Expandable Criteria & Documents */}
                    {isExpanded && (
                      <div style={styles.oppDetails}>
                        <div style={styles.detailSectionTitle}>Eligibility Breakdown (Explainable AI Engine):</div>
                        <div style={styles.checksList}>
                          {opp.checks.map((chk, i) => (
                            <div key={i} style={styles.checkRow}>
                              <span style={{ color: chk.ok ? '#059669' : '#e11d48', fontWeight: 800, fontSize: '14px', lineHeight: 1 }}>
                                {chk.ok ? '✓' : '✕'}
                              </span>
                              <span style={{ fontSize: '12.5px', color: chk.ok ? '#1e293b' : '#64748b' }}>
                                {chk.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Documents Needed */}
                        <div style={{ marginTop: '14px' }}>
                          <div style={styles.detailSectionTitle}>Required Documents for MPOnline / Kiosk Submission:</div>
                          <div style={styles.docList}>
                            {opp.requiredDocs.map((doc, idx) => (
                              <div key={idx} style={styles.docItem}>
                                <DocumentIcon size={13} color="#059669" />
                                <span>{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={styles.oppActionsRow}>
                          <button
                            className="ym-cta"
                            style={styles.chatApplyBtn}
                            onClick={() => handleApplyInChat(opp)}
                          >
                            <span>Pre-fill in Jan Seva Chat</span>
                            <ArrowRightIcon size={14} color="#ffffff" />
                          </button>

                          <button
                            style={styles.copyDocsBtn}
                            onClick={() => handleCopyChecklist(opp)}
                          >
                            {copiedDocId === opp.id ? '✓ Checklist Copied' : 'Copy Doc Checklist'}
                          </button>

                          <a
                            href={opp.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.portalLinkBtn}
                          >
                            <span>Official Portal</span>
                            <ExternalLinkIcon size={13} color="#64748b" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 9999,
  },
  modal: {
    background: '#f8fafc',
    borderRadius: '24px',
    maxWidth: '1100px',
    width: '100%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    fontFamily: 'var(--font-body)',
  },
  header: {
    padding: '24px 28px 18px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  badgeRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' },
  badge: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#059669',
    background: 'rgba(5, 150, 105, 0.1)',
    padding: '3px 9px',
    borderRadius: '999px',
    letterSpacing: '0.4px',
  },
  pulseLive: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#0284c7',
    background: '#f0f9ff',
    padding: '3px 9px',
    borderRadius: '999px',
    letterSpacing: '0.4px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
    fontFamily: 'var(--font-display)',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.45,
  },
  summaryBanner: {
    display: 'flex',
    background: '#ffffff',
    padding: '16px 28px',
    borderBottom: '1px solid #e2e8f0',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, minWidth: '180px' },
  summaryLabel: { fontSize: '11.5px', color: '#64748b', fontWeight: 600, marginBottom: '2px' },
  summaryVal: { fontSize: '15px', color: '#0f172a' },
  summaryDivider: { width: '1px', height: '36px', background: '#e2e8f0' },
  presetSection: {
    padding: '12px 28px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e2e8f0',
  },
  presetLabel: { fontSize: '12px', fontWeight: 700, color: '#475569' },
  presetGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  presetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '8px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterCol: {
    padding: '24px 20px',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '4px',
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', fontWeight: 700, color: '#334155' },
  ageRelNote: { fontSize: '10.5px', color: '#059669', fontWeight: 700 },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  pillBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 11px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  pillBtnActive: {
    background: '#ecfdf5',
    borderColor: '#059669',
    color: '#047857',
    fontWeight: 700,
  },
  slider: {
    width: '100%',
    accentColor: '#059669',
    cursor: 'pointer',
  },
  resultsCol: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    paddingBottom: '4px',
  },
  tabBtn: {
    padding: '7px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  tabBtnActive: {
    background: '#0f172a',
    borderColor: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
  },
  opportunitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  oppCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '18px 20px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  oppCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    cursor: 'pointer',
  },
  oppTypeBadge: {
    fontSize: '10.5px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.3px',
  },
  oppDept: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 500,
  },
  oppTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 2px',
    fontFamily: 'var(--font-display)',
  },
  oppHindi: {
    fontSize: '12.5px',
    color: '#059669',
    fontWeight: 600,
  },
  scorePill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '10px',
  },
  oppBenefitBanner: {
    marginTop: '12px',
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12.5px',
    color: '#334155',
    border: '1px solid #f1f5f9',
  },
  oppDetails: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  detailSectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  checksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  docList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '6px',
  },
  docItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
    background: '#f8fafc',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  oppActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '18px',
    paddingTop: '14px',
    borderTop: '1px solid #f1f5f9',
  },
  chatApplyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
  },
  copyDocsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  portalLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '9px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },
}
