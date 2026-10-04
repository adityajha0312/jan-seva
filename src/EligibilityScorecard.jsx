import { useState, useMemo } from 'react'
import {
  CloseIcon, ArrowRightIcon, DocumentIcon, FemaleIcon, MaleIcon,
  AgricultureIcon, HomeHeartIcon, WorkerToolsIcon, EducationIcon, BriefcaseJobIcon, StoreIcon,
} from './Icons'

const MP_SCHEMES_CRITERIA = [
  {
    id: 'ladli-behna',
    name: 'Mukhyamantri Ladli Behna Yojana (MP)',
    benefitAmount: 15000,
    benefitText: '₹15,000 / year (₹1,250 / month direct bank transfer)',
    category: 'Women Empowerment',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isFemale = p.gender === 'female'
      const ageOk = p.age >= 21 && p.age <= 60
      const incomeOk = p.income !== 'high'

      if (isFemale) { checks.push({ text: 'Female resident of Madhya Pradesh', ok: true }); score += 40 }
      else checks.push({ text: 'Scheme is exclusively for women applicants', ok: false })

      if (ageOk) { checks.push({ text: `Age ${p.age} is within eligible bracket (21 - 60 years)`, ok: true }); score += 30 }
      else checks.push({ text: 'Age must be between 21 and 60 years', ok: false })

      if (incomeOk) { checks.push({ text: 'Annual family income below ₹2.5 Lakh', ok: true }); score += 30 }
      else checks.push({ text: 'Income exceeds maximum limit (₹2.5 Lakh/yr)', ok: false })

      return { score, checks, requiredDocs: ['Samagra ID (e-KYC done)', 'Aadhaar Card', 'DBT-linked Bank Account'] }
    }
  },
  {
    id: 'kisan-kalyan-combined',
    name: 'PM-KISAN + MP Mukhyamantri Kisan Kalyan',
    benefitAmount: 12000,
    benefitText: '₹12,000 / year (₹6,000 Central + ₹6,000 MP Govt)',
    category: 'Agriculture & Farmers',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isFarmer = p.occupation === 'farmer'
      const hasLand = p.land !== 'none'

      if (isFarmer) { checks.push({ text: 'Occupation registered as Farmer / Cultivator', ok: true }); score += 40 }
      else checks.push({ text: 'Must be actively engaged in agriculture', ok: false })

      if (hasLand) { checks.push({ text: 'Cultivable agricultural landholding in MP records', ok: true }); score += 40 }
      else checks.push({ text: 'Agricultural landholding record (Khasra/B-1) required', ok: false })

      if (p.category) { checks.push({ text: 'Valid citizen demographic registry in MP', ok: true }); score += 20 }

      return { score, checks, requiredDocs: ['Land Record (Khasra/Khatauni B-1)', 'Aadhaar Card', 'Bank Passbook with NPCI Aadhaar Seeding'] }
    }
  },
  {
    id: 'sambal-yojana',
    name: 'Mukhyamantri Jan Kalyan (Sambal 2.0) Yojana',
    benefitAmount: 16000,
    benefitText: 'Social security, ₹16,000 maternity aid, accidental & education cover',
    category: 'Unorganized Workers',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isWorker = ['unorganized', 'farmer', 'homemaker'].includes(p.occupation)
      const ageOk = p.age >= 18 && p.age <= 60
      const incomeOk = p.income !== 'high'

      if (isWorker) { checks.push({ text: 'Unorganized worker / laborer / marginal cultivator', ok: true }); score += 40 }
      else checks.push({ text: 'Targeted at unorganized sector workers and laborers', ok: false })

      if (ageOk) { checks.push({ text: `Age ${p.age} is eligible (18 - 60 years)`, ok: true }); score += 30 }
      else checks.push({ text: 'Age must be between 18 and 60 years', ok: false })

      if (incomeOk) { checks.push({ text: 'Family not paying income tax', ok: true }); score += 30 }
      else checks.push({ text: 'Taxpayers are excluded', ok: false })

      return { score, checks, requiredDocs: ['Samagra Member ID', 'Aadhaar Card', 'Declaration of Unorganized Employment'] }
    }
  },
  {
    id: 'seekho-kamao',
    name: 'Mukhyamantri Seekho Kamao Yojana (MMSKY)',
    benefitAmount: 108000,
    benefitText: '₹8,000 - ₹10,000 / month stipend + industry skill certification',
    category: 'Youth & Employment',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isYouth = ['youth', 'student'].includes(p.occupation)
      const ageOk = p.age >= 18 && p.age <= 29

      if (isYouth) { checks.push({ text: 'Student / Fresher / Job-seeking Youth', ok: true }); score += 50 }
      else checks.push({ text: 'Open to fresh graduates and job-seeking youth', ok: false })

      if (ageOk) { checks.push({ text: `Age ${p.age} falls in youth bracket (18 - 29 years)`, ok: true }); score += 50 }
      else checks.push({ text: 'Applicant age must be between 18 and 29 years', ok: false })

      return { score, checks, requiredDocs: ['12th / ITI / Diploma / Degree Marksheet', 'Samagra ID', 'Aadhaar Card', 'MP Domicile Certificate'] }
    }
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat (Niramayam MP)',
    benefitAmount: 500000,
    benefitText: '₹5 Lakh / year free cashless medical treatment per family',
    category: 'Healthcare',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isLowIncome = ['bpl', 'low', 'mid'].includes(p.income)
      const hasCard = p.isBpl || p.isSambal

      if (isLowIncome || hasCard) { checks.push({ text: 'Eligible under BPL / SECC / Sambal cardholder category', ok: true }); score += 60 }
      else checks.push({ text: 'Requires BPL, NFSA ration card, or Sambal registration', ok: false })

      checks.push({ text: 'All family members covered under annual cashless pool', ok: true }); score += 40

      return { score, checks, requiredDocs: ['Ration Card / Samagra Family ID', 'Aadhaar Card of all members'] }
    }
  },
  {
    id: 'pm-awas-gramin',
    name: 'PM Awas Yojana (Gramin/Urban Housing)',
    benefitAmount: 120000,
    benefitText: '₹1.20 Lakh - ₹2.50 Lakh financial grant for pucca house',
    category: 'Housing',
    evaluate: (p) => {
      const checks = []
      let score = 0
      const isLowIncome = ['bpl', 'low'].includes(p.income)

      if (isLowIncome || p.isBpl) { checks.push({ text: 'Identified economically weaker section / BPL category', ok: true }); score += 50 }
      else checks.push({ text: 'Exclusively for families without a pucca house', ok: false })

      if (p.land === 'none' || p.land === 'marginal') { checks.push({ text: 'Eligible homestead / landholding status', ok: true }); score += 50 }
      else checks.push({ text: 'Large landholders may require manual gram sabha verification', ok: false })

      return { score, checks, requiredDocs: ['Aadhaar Card', 'Bank Passbook', 'MGNREGA Job Card (for Gramin)', 'Land Ownership / Allotment papers'] }
    }
  }
]

export default function EligibilityScorecard({ onClose, onSelectSchemeToApply, defaultProfile }) {
  const [profile, setProfile] = useState({
    district: defaultProfile?.location || 'Bhopal',
    age: defaultProfile?.age ? parseInt(defaultProfile.age) : 32,
    gender: 'female',
    occupation: defaultProfile?.occupation?.toLowerCase().includes('farm') ? 'farmer' : 'homemaker',
    income: 'low', // 'bpl' | 'low' (<2.5L) | 'mid' (2.5L-5L) | 'high' (>5L)
    land: 'marginal', // 'none' | 'marginal' (<2.5 acre) | 'small' (2.5-5 acre) | 'large' (>5 acre)
    category: 'OBC',
    isBpl: false,
    isSambal: true
  })

  const [expandedScheme, setExpandedScheme] = useState('ladli-behna')

  // Calculate results for all schemes
  const results = useMemo(() => {
    return MP_SCHEMES_CRITERIA.map((scheme) => {
      const evaluation = scheme.evaluate(profile)
      return {
        ...scheme,
        ...evaluation
      }
    }).sort((a, b) => b.score - a.score)
  }, [profile])

  const highMatchSchemes = results.filter((r) => r.score >= 70)
  const totalAnnualCash = highMatchSchemes
    .filter((s) => s.id !== 'ayushman-bharat') // keep insurance separate from direct cash
    .reduce((acc, s) => acc + s.benefitAmount, 0)

  return (
    <div className="ym-modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="ym-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
            <span style={styles.badge}>Predictive AI · Explainable Governance</span>
            <h2 style={styles.title}>Citizen Eligibility Match Scorecard</h2>
            <p style={styles.subtitle}>
              Instant AI eligibility scoring with transparent rule explainability and cumulative benefit calculation.
            </p>
          </div>
          <button className="ym-close-pill-btn" onClick={onClose} aria-label="Close" title="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div style={styles.summaryBanner}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Matched Schemes</div>
            <div style={styles.summaryVal}>
              <strong style={{ color: 'var(--color-forest)', fontSize: '22px' }}>{highMatchSchemes.length}</strong> / {MP_SCHEMES_CRITERIA.length} Eligible
            </div>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Estimated Annual Direct Benefit</div>
            <div style={styles.summaryVal}>
              <strong style={{ color: 'var(--color-marigold-dark)', fontSize: '22px' }}>
                ₹{totalAnnualCash.toLocaleString('en-IN')}
              </strong> / year
            </div>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Health Insurance Pool</div>
            <div style={styles.summaryVal}>
              <strong style={{ color: 'var(--color-forest)', fontSize: '18px' }}>₹5,00,000</strong> Cashless Cover
            </div>
          </div>
        </div>

        <div className="ym-scorecard-grid">
          {/* Left Column: Quick Profile Filters */}
          <div style={styles.filterCol}>
            <div style={styles.filterTitle}>Adjust Citizen Profile:</div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Gender</label>
              <div style={styles.pillRow}>
                {['female', 'male'].map((g) => (
                  <button
                    key={g}
                    style={{ ...styles.pillBtn, ...(profile.gender === g ? styles.pillBtnActive : {}) }}
                    onClick={() => setProfile((p) => ({ ...p, gender: g }))}
                  >
                    {g === 'female' ? (
                      <>
                        <FemaleIcon size={14} color="currentColor" />
                        <span>Female</span>
                      </>
                    ) : (
                      <>
                        <MaleIcon size={14} color="currentColor" />
                        <span>Male</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={styles.filterLabel}>Age: <strong>{profile.age} yrs</strong></label>
              </div>
              <input
                type="range"
                min="18"
                max="75"
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Occupation</label>
              <div style={styles.occGrid}>
                {[
                  { id: 'farmer', label: 'Farmer / Cultivator', Icon: AgricultureIcon },
                  { id: 'homemaker', label: 'Homemaker (Women)', Icon: HomeHeartIcon },
                  { id: 'unorganized', label: 'Laborer / Worker', Icon: WorkerToolsIcon },
                  { id: 'student', label: 'Student / Scholar', Icon: EducationIcon },
                  { id: 'youth', label: 'Job-Seeking Youth', Icon: BriefcaseJobIcon },
                  { id: 'business', label: 'Small Business', Icon: StoreIcon },
                ].map((item) => {
                  const isActive = profile.occupation === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      style={{ ...styles.occBtn, ...(isActive ? styles.occBtnActive : {}) }}
                      onClick={() => setProfile((p) => ({ ...p, occupation: item.id }))}
                    >
                      <item.Icon size={14} color={isActive ? '#ffffff' : '#059669'} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Annual Family Income</label>
              <select
                style={styles.select}
                value={profile.income}
                onChange={(e) => setProfile((p) => ({ ...p, income: e.target.value }))}
              >
                <option value="bpl">BPL / Below ₹1 Lakh</option>
                <option value="low">₹1 Lakh - ₹2.5 Lakh (Eligible for most)</option>
                <option value="mid">₹2.5 Lakh - ₹5 Lakh</option>
                <option value="high">Above ₹5 Lakh</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Agricultural Landholding</label>
              <select
                style={styles.select}
                value={profile.land}
                onChange={(e) => setProfile((p) => ({ ...p, land: e.target.value }))}
              >
                <option value="none">Landless / None</option>
                <option value="marginal">Marginal (Under 2.5 Acres)</option>
                <option value="small">Small (2.5 - 5 Acres)</option>
                <option value="large">Above 5 Acres</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Cardholder Status</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={profile.isBpl}
                    onChange={(e) => setProfile((p) => ({ ...p, isBpl: e.target.checked }))}
                  />
                  <span>Ration / BPL Card Holder</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={profile.isSambal}
                    onChange={(e) => setProfile((p) => ({ ...p, isSambal: e.target.checked }))}
                  />
                  <span>MP Sambal Card Holder</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Scorecards with Explainability breakdown */}
          <div style={styles.schemeCol}>
            <div style={styles.schemeListHeading}>
              Ranked Scheme Matches ({results.length} Analyzed)
            </div>

            <div style={styles.cardsList}>
              {results.map((scheme) => {
                const isHigh = scheme.score >= 70
                const isExpanded = expandedScheme === scheme.id

                return (
                  <div
                    key={scheme.id}
                    style={{
                      ...styles.schemeCard,
                      borderColor: isHigh ? 'rgba(20,83,45,0.28)' : '#e2e8f0',
                      background: isHigh ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <div
                      style={styles.cardHeader}
                      onClick={() => setExpandedScheme(isExpanded ? null : scheme.id)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={styles.categoryPill}>{scheme.category}</span>
                          <span
                            style={{
                              ...styles.matchScorePill,
                              background: scheme.score >= 80 ? '#dcfce7' : scheme.score >= 50 ? '#fef3c7' : '#fee2e2',
                              color: scheme.score >= 80 ? '#15803d' : scheme.score >= 50 ? '#b45309' : '#b91c1c'
                            }}
                          >
                            {scheme.score}% Match
                          </span>
                        </div>
                        <h4 style={styles.schemeName}>{scheme.name}</h4>
                        <div style={styles.benefitHighlight}>{scheme.benefitText}</div>
                      </div>
                      <button style={styles.expandToggle}>
                        {isExpanded ? '▲ Hide' : '▼ Details'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={styles.cardExpandedArea}>
                        {/* Explainability Checklist */}
                        <div style={styles.explainTitle}>Why you qualify (Explainable Rules):</div>
                        <div style={styles.checkList}>
                          {scheme.checks.map((chk, i) => (
                            <div key={i} style={styles.checkItem}>
                              <span style={{ color: chk.ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                                {chk.ok ? '✓' : '✕'}
                              </span>
                              <span style={{ color: chk.ok ? '#1e293b' : '#64748b' }}>{chk.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Documents needed */}
                        <div style={{ marginTop: '10px' }}>
                          <div style={styles.explainTitle}>Required Verification Documents:</div>
                          <div style={styles.docsList}>
                            {scheme.requiredDocs.map((doc, idx) => (
                              <span key={idx} style={styles.docTag}>{doc}</span>
                            ))}
                          </div>
                        </div>

                        {/* Action CTA */}
                        {isHigh && (
                          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              className="ym-cta"
                              style={styles.applyNowBtn}
                              onClick={() => {
                                onClose()
                                if (onSelectSchemeToApply) onSelectSchemeToApply(scheme)
                              }}
                            >
                              Pre-Fill Application Form →
                            </button>
                          </div>
                        )}
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
    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', zIndex: 9999, backdropFilter: 'blur(5px)',
  },
  modal: {
    background: '#ffffff', borderRadius: '18px', padding: '24px',
    maxWidth: '840px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
    position: 'relative',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '10px' },
  badge: {
    display: 'inline-block', fontSize: '11px', fontWeight: 700, color: 'var(--color-forest)',
    background: 'rgba(20,83,45,0.1)', padding: '3px 10px', borderRadius: '999px', marginBottom: '6px',
  },
  title: { margin: 0, fontSize: '21px', color: 'var(--color-forest)', fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: 'var(--color-charcoal-soft)', lineHeight: 1.4 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-charcoal-soft)' },
  summaryBanner: {
    display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '14px 18px',
    background: 'linear-gradient(135deg, var(--color-sage) 0%, #fff 100%)',
    borderRadius: '12px', border: '1px solid rgba(20,83,45,0.15)', marginBottom: '18px', flexWrap: 'wrap', gap: '12px',
  },
  summaryItem: { textAlign: 'center' },
  summaryLabel: { fontSize: '11px', color: 'var(--color-charcoal-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' },
  summaryVal: { marginTop: '2px', fontSize: '14px', color: '#1e293b' },
  summaryDivider: { width: '1px', height: '36px', background: 'rgba(20,83,45,0.15)' },
  bodyLayout: { display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '20px' },
  filterCol: {
    background: '#fafaf9', padding: '14px', borderRadius: '12px', border: '1px solid #e7e5e4',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  filterTitle: { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  filterLabel: { fontSize: '12px', fontWeight: 600, color: '#334155' },
  pillRow: { display: 'flex', gap: '6px' },
  pillBtn: {
    flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
    background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    transition: 'all 0.15s ease',
  },
  pillBtnActive: { background: 'var(--color-forest)', color: '#fff', borderColor: 'var(--color-forest)' },
  occGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' },
  occBtn: {
    padding: '7px 8px', borderRadius: '8px', border: '1px solid #cbd5e1',
    background: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '5px', textAlign: 'left',
    color: '#334155', transition: 'all 0.15s ease', fontFamily: 'inherit',
  },
  occBtnActive: {
    background: 'var(--color-forest)', color: '#ffffff', borderColor: 'var(--color-forest)',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
  },
  select: {
    width: '100%', padding: '7px 9px', borderRadius: '7px', border: '1px solid #cbd5e1',
    fontSize: '12.5px', fontFamily: 'inherit', background: '#fff',
  },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155', cursor: 'pointer' },
  schemeCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
  schemeListHeading: { fontSize: '13px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: '0.3px' },
  cardsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  schemeCard: {
    borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden',
    transition: 'box-shadow 0.15s ease',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px',
    cursor: 'pointer', gap: '8px',
  },
  categoryPill: {
    fontSize: '10.5px', fontWeight: 700, color: 'var(--color-charcoal-soft)',
    background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px',
  },
  matchScorePill: {
    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
  },
  schemeName: { margin: '6px 0 3px', fontSize: '15px', fontWeight: 700, color: 'var(--color-forest)' },
  benefitHighlight: { fontSize: '12.5px', color: 'var(--color-marigold-dark)', fontWeight: 600 },
  expandToggle: {
    background: 'none', border: 'none', fontSize: '11.5px', fontWeight: 600,
    color: 'var(--color-forest)', cursor: 'pointer', padding: '4px',
  },
  cardExpandedArea: {
    padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
  },
  explainTitle: { fontSize: '11.5px', fontWeight: 700, color: '#475569', margin: '10px 0 6px', textTransform: 'uppercase' },
  checkList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' },
  docsList: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  docTag: {
    fontSize: '11px', background: '#e2e8f0', color: '#334155', padding: '3px 8px',
    borderRadius: '6px', fontWeight: 600,
  },
  applyNowBtn: {
    padding: '9px 18px', borderRadius: '8px', border: 'none', background: 'var(--color-forest)',
    color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
}
