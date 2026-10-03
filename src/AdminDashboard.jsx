import { useState, useMemo } from 'react'
import Logo from './Logo'
import { CloseIcon, SearchIcon, ShieldAlertIcon, BarChartIcon } from './Icons'

// Helper inline vector icons to ensure zero external export dependency
function WarningTriangleIcon({ size = 16, color = '#e11d48' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function BellRingingIcon({ size = 16, color = '#f59e0b' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function CheckmarkIcon({ size = 16, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CpuChipIcon({ size = 16, color = '#0284c7' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  )
}

function LightningIcon({ size = 15, color = '#f59e0b' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

// 1. Live District Operational Metrics
const DISTRICT_METRICS = [
  { district: 'Bhopal', queries: 24350, applications: 8420, topScheme: 'Ladli Behna Yojana', slaRate: '96.4%', grievanceCount: 42, riskLevel: 'low' },
  { district: 'Indore', queries: 28910, applications: 9140, topScheme: 'Seekho Kamao Yojana', slaRate: '97.1%', grievanceCount: 38, riskLevel: 'low' },
  { district: 'Jabalpur', queries: 16820, applications: 4890, topScheme: 'Sambal 2.0 Yojana', slaRate: '93.5%', grievanceCount: 56, riskLevel: 'medium' },
  { district: 'Gwalior', queries: 15410, applications: 4210, topScheme: 'PM-KISAN + Kalyan', slaRate: '88.2%', grievanceCount: 89, riskLevel: 'critical' },
  { district: 'Ujjain', queries: 13200, applications: 3950, topScheme: 'Ladli Behna Yojana', slaRate: '95.8%', grievanceCount: 31, riskLevel: 'low' },
  { district: 'Sagar', queries: 11450, applications: 3120, topScheme: 'PM Awas Gramin', slaRate: '89.6%', grievanceCount: 78, riskLevel: 'high' },
  { district: 'Rewa', queries: 9840, applications: 2810, topScheme: 'Post-Matric Scholarship', slaRate: '90.4%', grievanceCount: 64, riskLevel: 'medium' },
  { district: 'Sehore', queries: 8760, applications: 2450, topScheme: 'Kisan Kalyan / PDS', slaRate: '94.8%', grievanceCount: 29, riskLevel: 'low' },
  { district: 'Dhar', queries: 7920, applications: 2180, topScheme: 'Aahar Anudan Tribal', slaRate: '86.5%', grievanceCount: 84, riskLevel: 'critical' },
  { district: 'Chhindwara', queries: 8150, applications: 2310, topScheme: 'Ayushman Bharat', slaRate: '93.8%', grievanceCount: 44, riskLevel: 'low' }
]

// 2. Predictive SLA Breach Radar (Early-Warning Engine)
const INITIAL_PREDICTIVE_ALERTS = [
  {
    id: 'sla-gwl-01',
    district: 'Gwalior',
    tehsil: 'Gwalior City & Dabra Sub-Division',
    service: 'Land Record Mutation (नामान्तरण / Khasra Update)',
    dept: 'Revenue Department (राजस्व विभाग)',
    statutorySlaDays: 15,
    currentAvgDays: 13.8,
    breachRiskPercent: 94,
    hoursToBreach: 32,
    pendingFiles: 418,
    rootCause: 'Sudden spike of 420 inheritance mutation claims following Lok Adalat + Patwari mobile verification delay.',
    recommendedAction: 'Trigger Section 4(2) temporary workload re-allocation: Auto-transfer 160 non-disputed files to Morar Tehsil.',
    status: 'pending',
  },
  {
    id: 'sla-sgr-02',
    district: 'Sagar',
    tehsil: 'Bina & Rahatgarh Block',
    service: 'BPL Ration Card Member Addition (राशन कार्ड संशोधन)',
    dept: 'Food, Civil Supplies & Consumer Protection',
    statutorySlaDays: 7,
    currentAvgDays: 6.4,
    breachRiskPercent: 88,
    hoursToBreach: 44,
    pendingFiles: 276,
    rootCause: 'Biometric e-KYC gateway re-try timeout on rural POS machines in 18 Gram Panchayats.',
    recommendedAction: 'Enable OTP-based provisional approval for children below 10 years; dispatch SMS token extension to ration dealer.',
    status: 'pending',
  },
  {
    id: 'sla-dhr-03',
    district: 'Dhar',
    tehsil: 'Kukshi & Gandhwani Tribal Belt',
    service: 'Aahar Anudan & Tribal Maternal Nutrition Benefit',
    dept: 'Tribal Affairs & Scheduled Caste Welfare',
    statutorySlaDays: 10,
    currentAvgDays: 9.2,
    breachRiskPercent: 85,
    hoursToBreach: 48,
    pendingFiles: 340,
    rootCause: 'NPCI Aadhaar-bank account mapping failure at Regional Gramin Bank post branch consolidation.',
    recommendedAction: 'Issue priority electronic mandate to Lead District Manager (LDM) Dhar for automated batch DBT re-push.',
    status: 'pending',
  },
  {
    id: 'sla-rew-04',
    district: 'Rewa',
    tehsil: 'Rewa Headquarter & Huzur',
    service: 'MP Post-Matric SC/ST College Scholarship Sanction',
    dept: 'Higher Education & Backward Classes Welfare',
    statutorySlaDays: 21,
    currentAvgDays: 19.3,
    breachRiskPercent: 78,
    hoursToBreach: 68,
    pendingFiles: 520,
    rootCause: '14 Private engineering & polytechnic institutes have delayed institutional fee verification certificates.',
    recommendedAction: 'Send automated legal compliance notice citing MP Public Service Guarantee Act Section 5 to college principals.',
    status: 'pending',
  }
]

// 3. CM Helpline 181 Live AI Queue
const CM_HELPLINE_QUEUE = [
  {
    ticketNo: 'CM-181-2026-8921',
    citizenName: 'Rameshwar Lodhi',
    district: 'Gwalior',
    category: 'Revenue Mutation',
    sentiment: 'High Distress / Frustrated',
    hoursOpen: 142,
    slaTargetHours: 168,
    aiSummary: 'Citizen applied for Khasra mutation 6 days ago. Office requested physical visit despite online MPOnline receipt. Citizen is a smallholder farmer.',
    priority: 'Urgent',
    escLevel: 'L2 (Sub-Divisional Magistrate)'
  },
  {
    ticketNo: 'CM-181-2026-8904',
    citizenName: 'Sunita Bai',
    district: 'Sagar',
    category: 'PDS Ration',
    sentiment: 'Urgent Survival Needs',
    hoursOpen: 118,
    slaTargetHours: 120,
    aiSummary: 'Newborn child not linked in Samagra/Ration quota. Local PDS dealer refused grain ration for the second consecutive month.',
    priority: 'Critical (2h to Breach)',
    escLevel: 'L1 (Tehsildar / Food Inspector)'
  },
  {
    ticketNo: 'CM-181-2026-8871',
    citizenName: 'Devendra Patel',
    district: 'Indore',
    category: 'Seekho Kamao Stipend',
    sentiment: 'Inquiry / Mild Delay',
    hoursOpen: 64,
    slaTargetHours: 168,
    aiSummary: 'Stipend for August training cycle in ITI Indore showed processed but bank account credited amount reversed due to KYC hold.',
    priority: 'Standard',
    escLevel: 'L1 (Employment Officer)'
  }
]

const SCHEME_DISTRIBUTION = [
  { name: 'Mukhyamantri Ladli Behna Yojana', share: 34, color: '#e11d48' },
  { name: 'PM-KISAN + MP Kisan Kalyan', share: 28, color: '#059669' },
  { name: 'Sambal 2.0 Social Security', share: 18, color: '#7c3aed' },
  { name: 'MMVY & Seekho Kamao Youth', share: 12, color: '#0284c7' },
  { name: 'PM Awas Yojana (Housing)', share: 8, color: '#d97706' }
]

export default function AdminDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('radar') // 'radar' | 'overview' | 'queue' | 'simulator'
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
  const [searchQuery, setSearchQuery] = useState('')
  const [predictiveAlerts, setPredictiveAlerts] = useState(INITIAL_PREDICTIVE_ALERTS)
  const [dispatchedIds, setDispatchedIds] = useState(new Set())
  const [toastMessage, setToastMessage] = useState(null)

  // Simulation Sliders
  const [simVolumeSurge, setSimVolumeSurge] = useState(25) // +25%
  const [simStaffCapacity, setSimStaffCapacity] = useState(85) // 85% staff active

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  function handleDispatchMitigation(alert) {
    setDispatchedIds((prev) => new Set(prev).add(alert.id))
    showToast(`⚡ Automated Mitigation Dispatched: Escalation memo sent to Collector & SDM (${alert.district}) via e-Office API.`)
  }

  // Filtered districts for table
  const filteredDistricts = useMemo(() => {
    return DISTRICT_METRICS.filter((d) => {
      const matchesSearch = d.district.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDistrict = selectedDistrict === 'All Districts' || d.district === selectedDistrict
      return matchesSearch && matchesDistrict
    })
  }, [searchQuery, selectedDistrict])

  // Calculated simulation metrics
  const simulatedBreachRate = useMemo(() => {
    const base = 5.8 // 5.8% base breach rate
    const volumeImpact = (simVolumeSurge / 100) * 8.5
    const staffImpact = ((100 - simStaffCapacity) / 100) * 11.2
    return (base + volumeImpact + staffImpact).toFixed(1)
  }, [simVolumeSurge, simStaffCapacity])

  const simulatedVulnerableDistricts = useMemo(() => {
    if (simVolumeSurge > 40 || simStaffCapacity < 75) {
      return ['Gwalior', 'Dhar', 'Sagar', 'Rewa', 'Jabalpur']
    } else if (simVolumeSurge > 20 || simStaffCapacity < 85) {
      return ['Gwalior', 'Dhar', 'Sagar']
    }
    return ['Gwalior', 'Dhar']
  }, [simVolumeSurge, simStaffCapacity])

  return (
    <div className="ym-modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="ym-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Bar */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Logo size={42} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={styles.govBadge}>Govt of MP · MPOnline</span>
                <span style={styles.liveIndicator}>● Live AI Monitoring</span>
                <span style={styles.actBadge}>Public Services Guarantee Act 2010</span>
              </div>
              <h2 style={styles.title}>Nodal Officer GovTech Command & Predictive SLA Radar</h2>
            </div>
          </div>
          <button className="ym-close-pill-btn" onClick={onClose} aria-label="Close" title="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'radar' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('radar')}
          >
            <WarningTriangleIcon size={15} color={activeTab === 'radar' ? '#ffffff' : '#e11d48'} />
            <span>Predictive SLA Radar ({predictiveAlerts.length})</span>
            <span style={styles.tabHotBadge}>AI FORECAST</span>
          </button>

          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'overview' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('overview')}
          >
            <BarChartIcon size={15} color={activeTab === 'overview' ? '#ffffff' : '#059669'} />
            <span>Statewide Metrics & Districts</span>
          </button>

          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'queue' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('queue')}
          >
            <ShieldAlertIcon size={15} color={activeTab === 'queue' ? '#ffffff' : '#0284c7'} />
            <span>CM Helpline 181 Live Queue</span>
          </button>

          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'simulator' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('simulator')}
          >
            <CpuChipIcon size={15} color={activeTab === 'simulator' ? '#ffffff' : '#7c3aed'} />
            <span>Surge & Stress Simulator</span>
          </button>
        </div>

        {/* Top KPIs Summary Banner */}
        <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Citizen Applications Handled</div>
            <div style={styles.kpiValue}>148,920</div>
            <div style={styles.kpiTrend}>▲ 89.2% Kiosk Auto-Fill Ready</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Statutory SLA Compliance</div>
            <div style={styles.kpiValue}>94.2%</div>
            <div style={styles.kpiTrend}>Avg. resolution: 4.8 Days</div>
          </div>
          <div style={{ ...styles.kpiCard, borderLeft: '4px solid #e11d48' }}>
            <div style={styles.kpiLabel}>Predicted SLA Breaches (48h)</div>
            <div style={{ ...styles.kpiValue, color: '#e11d48' }}>4 High-Risk Hotspots</div>
            <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700 }}>1,554 Citizens Affected</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Welfare DBT Disbursed (MTD)</div>
            <div style={{ ...styles.kpiValue, color: '#059669' }}>₹54.8 Cr</div>
            <div style={styles.kpiTrend}>100% Aadhaar-NPCI Seeded</div>
          </div>
        </div>

        {/* TAB 1: PREDICTIVE SLA RADAR (CORE FEATURE) */}
        {activeTab === 'radar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.radarBanner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.radarIconWrap}>
                  <WarningTriangleIcon size={24} color="#e11d48" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#881337', fontWeight: 800 }}>
                    Early-Warning Machine Learning Model (Trained on 1.2M Historical MPOnline & 181 Transactions)
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#9f1239', lineHeight: 1.4 }}>
                    Predicts departmental service delays <strong>36 to 72 hours before the statutory SLA expires</strong> under the MP Public Service Guarantee Act 2010. 
                    Nodal officers can execute automated pre-emptive workload balancing with one click.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.alertCardsGrid}>
              {predictiveAlerts.map((alert) => {
                const isDispatched = dispatchedIds.has(alert.id)
                const isCritical = alert.breachRiskPercent >= 90

                return (
                  <div
                    key={alert.id}
                    style={{
                      ...styles.alertCard,
                      borderLeft: `5px solid ${isCritical ? '#e11d48' : '#f59e0b'}`,
                    }}
                  >
                    <div style={styles.alertCardTop}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={isCritical ? styles.badgeCritical : styles.badgeHigh}>
                          {isCritical ? 'CRITICAL RISK' : 'HIGH RISK'} · {alert.breachRiskPercent}% BREACH CHANCE
                        </span>
                        <span style={styles.badgeHours}>
                          ⏳ Est. Breach in {alert.hoursToBreach} Hours
                        </span>
                      </div>
                      <span style={styles.districtBadge}>{alert.district} ({alert.tehsil})</span>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <h4 style={styles.alertServiceTitle}>{alert.service}</h4>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        {alert.dept} · Statutory SLA: <strong>{alert.statutorySlaDays} Days</strong> (Current: {alert.currentAvgDays} Days)
                      </div>
                    </div>

                    <div style={styles.alertDetailsBox}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '12px' }}>Root Cause Diagnosis:</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>
                          {alert.rootCause}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#047857', fontSize: '12px' }}>AI Recommended Action:</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#065f46', lineHeight: 1.45 }}>
                          {alert.recommendedAction}
                        </p>
                      </div>
                    </div>

                    <div style={styles.alertActionRow}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Affected Citizens: <strong style={{ color: '#0f172a' }}>{alert.pendingFiles} applications</strong>
                      </div>
                      
                      <button
                        style={isDispatched ? styles.dispatchedBtn : styles.actionBtn}
                        onClick={() => handleDispatchMitigation(alert)}
                        disabled={isDispatched}
                      >
                        {isDispatched ? (
                          <>
                            <CheckmarkIcon size={14} color="#065f46" />
                            <span>Mitigation Active (Collector Notified)</span>
                          </>
                        ) : (
                          <>
                            <LightningIcon size={14} color="#ffffff" />
                            <span>Execute AI Workload Balancing</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW & DISTRICTS */}
        {activeTab === 'overview' && (
          <div style={styles.gridSection}>
            {/* Left: District Wise Table */}
            <div style={styles.panelCard}>
              <div style={styles.panelHeader}>
                <div>
                  <h3 style={styles.panelTitle}>District Welfare Fulfillment & Grievances</h3>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>Real-time inquiry volume & compliance status</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    style={styles.selectDistrict}
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    aria-label="Filter District"
                  >
                    <option value="All Districts">All Districts</option>
                    {DISTRICT_METRICS.map((d) => (
                      <option key={d.district} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                  <input
                    style={styles.searchInput}
                    placeholder="Search district..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>District</th>
                      <th style={styles.th}>Inquiries</th>
                      <th style={styles.th}>Applications</th>
                      <th style={styles.th}>Top Demand Scheme</th>
                      <th style={styles.th}>SLA Rate</th>
                      <th style={styles.th}>Risk Pulse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDistricts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                          No districts match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDistricts.map((d) => (
                        <tr key={d.district} style={styles.tr}>
                          <td style={styles.td}><strong>{d.district}</strong></td>
                          <td style={styles.td}>{d.queries.toLocaleString('en-IN')}</td>
                          <td style={styles.td}>{d.applications.toLocaleString('en-IN')}</td>
                          <td style={styles.td}>
                            <span style={styles.schemeTag}>{d.topScheme}</span>
                          </td>
                          <td style={styles.td}>
                            <strong style={{ color: parseFloat(d.slaRate) >= 94 ? '#16a34a' : '#e11d48' }}>
                              {d.slaRate}
                            </strong>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: d.riskLevel === 'critical' ? '#ffe4e6' : d.riskLevel === 'high' ? '#fef3c7' : '#ecfdf5',
                              color: d.riskLevel === 'critical' ? '#be123c' : d.riskLevel === 'high' ? '#b45309' : '#047857'
                            }}>
                              {d.riskLevel.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Scheme Share */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}>Welfare Scheme Application Share</h3>
                <div style={styles.barContainer}>
                  {SCHEME_DISTRIBUTION.map((item) => (
                    <div key={item.name} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{item.name}</span>
                        <strong style={{ color: item.color }}>{item.share}%</strong>
                      </div>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${item.share}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}>Statutory Escalation Matrix</h3>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span>Level 1: Tehsildar / Designated Officer</span>
                    <strong style={{ color: '#059669' }}>0 - 5 Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span>Level 2: Sub-Divisional Magistrate (SDM)</span>
                    <strong style={{ color: '#f59e0b' }}>6 - 10 Days</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span>Level 3: District Collector / Department HOD</span>
                    <strong style={{ color: '#e11d48' }}>&gt; 10 Days (Penalty)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CM HELPLINE 181 LIVE QUEUE */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={styles.queueHeaderBox}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>
                  CM Helpline 181 AI Escalation Pipeline
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Grievances logged via Jan Seva voice assistant or web portal, automatically categorized with legal references under MP Public Service Guarantee Act 2010.
                </p>
              </div>
              <span style={styles.queueCountBadge}>3 High Priority Calls Active</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CM_HELPLINE_QUEUE.map((ticket) => (
                <div key={ticket.ticketNo} style={styles.ticketCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.ticketNo}>{ticket.ticketNo}</span>
                        <span style={styles.ticketCategory}>{ticket.category}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: ticket.priority.includes('Critical') ? '#fee2e2' : '#fef3c7',
                          color: ticket.priority.includes('Critical') ? '#b91c1c' : '#b45309'
                        }}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                        Citizen: {ticket.citizenName} · District: {ticket.district}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Current Escalation Level</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0284c7' }}>{ticket.escLevel}</div>
                    </div>
                  </div>

                  <p style={styles.ticketSummary}>{ticket.aiSummary}</p>

                  <div style={styles.ticketBottomRow}>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Citizen Sentiment: <strong style={{ color: '#be123c' }}>{ticket.sentiment}</strong> · Open for {ticket.hoursOpen}h / {ticket.slaTargetHours}h SLA
                    </div>
                    <button
                      style={styles.expediteBtn}
                      onClick={() => showToast(`🚨 Expedite Order Issued: Notice sent to ${ticket.escLevel} with 24h statutory deadline.`)}
                    >
                      Issue 24h Expedite Order →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SURGE & STRESS SIMULATOR */}
        {activeTab === 'simulator' && (
          <div style={styles.simulatorWrap}>
            <div style={styles.simIntro}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <CpuChipIcon size={20} color="#7c3aed" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#581c87', fontWeight: 800 }}>
                  What-If Scenario Stress Testing (Policy Sandbox)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#6b21a8', lineHeight: 1.45 }}>
                Simulate weather extremes (unseasonal rain crop loss), festival application rushes (Ladli Behna disbursals), or administrative staff leaves to calculate projected SLA failure risks before they occur.
              </p>
            </div>

            <div style={styles.simControlsGrid}>
              <div style={styles.simControlCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={styles.simLabel}>Simulated Application Volume Surge</label>
                  <strong style={{ color: '#7c3aed', fontSize: '15px' }}>+{simVolumeSurge}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simVolumeSurge}
                  onChange={(e) => setSimVolumeSurge(Number(e.target.value))}
                  style={styles.slider}
                />
                <div style={styles.sliderTicks}>
                  <span>Normal (0%)</span>
                  <span>Moderate (+50%)</span>
                  <span>Crisis (+100%)</span>
                </div>
              </div>

              <div style={styles.simControlCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={styles.simLabel}>Tehsil Field Staff Available</label>
                  <strong style={{ color: '#059669', fontSize: '15px' }}>{simStaffCapacity}%</strong>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={simStaffCapacity}
                  onChange={(e) => setSimStaffCapacity(Number(e.target.value))}
                  style={styles.slider}
                />
                <div style={styles.sliderTicks}>
                  <span>50% (Staff Shortage)</span>
                  <span>75%</span>
                  <span>100% (Full Capacity)</span>
                </div>
              </div>
            </div>

            {/* Simulation Results Output */}
            <div style={styles.simOutputCard}>
              <div style={styles.simOutputHeader}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                    Projected Statewide Outcome
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: Number(simulatedBreachRate) > 10 ? '#be123c' : '#059669' }}>
                    {simulatedBreachRate}% Predicted SLA Breach Rate
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Estimated Citizen Grievances:</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    ~{Math.round(simVolumeSurge * 14.5 + (100 - simStaffCapacity) * 8)} / week
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Vulnerable Districts Requiring Pre-emptive Staffing:</strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {simulatedVulnerableDistricts.map((dist) => (
                    <span key={dist} style={styles.vulnerablePill}>
                      ⚠️ {dist} District
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div style={styles.toast}>
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 9999,
    backdropFilter: 'blur(6px)',
  },
  modal: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '1060px',
    width: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    fontFamily: 'var(--font-body)',
    boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
    position: 'relative',
    border: '1px solid rgba(226, 232, 240, 0.8)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '12px',
  },
  govBadge: {
    background: '#059669',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 800,
    padding: '3px 9px',
    borderRadius: '6px',
    letterSpacing: '0.02em',
  },
  liveIndicator: {
    color: '#059669',
    fontSize: '11px',
    fontWeight: 700,
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '3px 8px',
    borderRadius: '999px',
  },
  actBadge: {
    color: '#475569',
    fontSize: '11px',
    fontWeight: 600,
    background: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    margin: '6px 0 0',
    fontSize: '19px',
    color: '#0f172a',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '18px',
    overflowX: 'auto',
    paddingBottom: '4px',
    borderBottom: '1px solid #e2e8f0',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#334155',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    background: '#059669',
    color: '#ffffff',
    borderColor: '#059669',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
  },
  tabHotBadge: {
    fontSize: '9.5px',
    fontWeight: 800,
    background: '#e11d48',
    color: '#ffffff',
    padding: '2px 5px',
    borderRadius: '4px',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  kpiCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
  },
  kpiLabel: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '4px 0 2px',
    lineHeight: 1.2,
  },
  kpiTrend: {
    fontSize: '11px',
    color: '#059669',
    fontWeight: 700,
  },
  radarBanner: {
    background: '#fff1f2',
    border: '1.5px solid #fecdd3',
    borderRadius: '14px',
    padding: '14px 18px',
  },
  radarIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#ffe4e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertCardsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  alertCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  alertCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  badgeCritical: {
    background: '#ffe4e6',
    color: '#be123c',
    fontSize: '11px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
  },
  badgeHigh: {
    background: '#fef3c7',
    color: '#b45309',
    fontSize: '11px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
  },
  badgeHours: {
    background: '#f1f5f9',
    color: '#0f172a',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
  },
  districtBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
  },
  alertServiceTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color: '#0f172a',
  },
  alertDetailsBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 14px',
    margin: '12px 0',
  },
  alertActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    paddingTop: '6px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
  },
  dispatchedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #a7f3d0',
    background: '#ecfdf5',
    color: '#065f46',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'default',
  },
  gridSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '16px',
  },
  panelCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  panelTitle: {
    fontSize: '13.5px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 3px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  selectDistrict: {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontFamily: 'inherit',
    background: '#ffffff',
    color: '#334155',
  },
  searchInput: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontFamily: 'inherit',
    width: '120px',
  },
  tableWrap: {
    maxHeight: '320px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    background: '#f1f5f9',
    color: '#475569',
    fontWeight: 800,
    borderBottom: '1px solid #cbd5e1',
    position: 'sticky',
    top: 0,
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '8px 10px',
    color: '#334155',
  },
  schemeTag: {
    fontSize: '11px',
    background: '#ecfdf5',
    color: '#047857',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 700,
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  barTrack: {
    height: '7px',
    background: '#f1f5f9',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },
  queueHeaderBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  queueCountBadge: {
    fontSize: '11.5px',
    fontWeight: 800,
    background: '#e11d48',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '999px',
  },
  ticketCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
  },
  ticketNo: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#059669',
    background: '#ecfdf5',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  ticketCategory: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#475569',
    background: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  ticketSummary: {
    fontSize: '12.5px',
    color: '#334155',
    lineHeight: 1.5,
    margin: '8px 0',
  },
  ticketBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '6px',
    borderTop: '1px solid #f1f5f9',
  },
  expediteBtn: {
    background: '#ffffff',
    border: '1px solid #e11d48',
    color: '#e11d48',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  simulatorWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  simIntro: {
    background: '#faf5ff',
    border: '1px solid #f3e8ff',
    borderRadius: '14px',
    padding: '14px 18px',
  },
  simControlsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
  },
  simControlCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
  },
  simLabel: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#0f172a',
  },
  slider: {
    width: '100%',
    accentColor: '#059669',
    cursor: 'pointer',
    margin: '8px 0 4px',
  },
  sliderTicks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10.5px',
    color: '#64748b',
  },
  simOutputCard: {
    background: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '14px',
    padding: '16px',
  },
  simOutputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  vulnerablePill: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11.5px',
    fontWeight: 700,
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0f172a',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: 600,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    zIndex: 99999,
  },
}
