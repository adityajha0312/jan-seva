import { useState } from 'react'
import Logo from './Logo'
import { CloseIcon } from './Icons'

const DISTRICT_METRICS = [
  { district: 'Bhopal', queries: 24350, applications: 8420, topScheme: 'Ladli Behna Yojana', slaRate: '96.4%', grievanceCount: 42 },
  { district: 'Indore', queries: 28910, applications: 9140, topScheme: 'Seekho Kamao Yojana', slaRate: '97.1%', grievanceCount: 38 },
  { district: 'Jabalpur', queries: 16820, applications: 4890, topScheme: 'Sambal 2.0 Yojana', slaRate: '93.5%', grievanceCount: 56 },
  { district: 'Gwalior', queries: 15410, applications: 4210, topScheme: 'PM-KISAN + Kalyan', slaRate: '94.0%', grievanceCount: 49 },
  { district: 'Ujjain', queries: 13200, applications: 3950, topScheme: 'Ladli Behna Yojana', slaRate: '95.8%', grievanceCount: 31 },
  { district: 'Sagar', queries: 11450, applications: 3120, topScheme: 'PM Awas Gramin', slaRate: '91.2%', grievanceCount: 68 },
  { district: 'Rewa', queries: 9840, applications: 2810, topScheme: 'PM-KISAN + Kalyan', slaRate: '92.6%', grievanceCount: 61 },
  { district: 'Sehore', queries: 8760, applications: 2450, topScheme: 'Kisan Kalyan / PDS', slaRate: '94.8%', grievanceCount: 29 },
  { district: 'Dhar', queries: 7920, applications: 2180, topScheme: 'Sambal / Tribal Aid', slaRate: '89.4%', grievanceCount: 74 },
  { district: 'Chhindwara', queries: 8150, applications: 2310, topScheme: 'Ayushman Bharat', slaRate: '93.8%', grievanceCount: 44 }
]

const SCHEME_DISTRIBUTION = [
  { name: 'Mukhyamantri Ladli Behna Yojana', share: 34, color: 'var(--color-rose)' },
  { name: 'PM-KISAN + MP Kisan Kalyan', share: 28, color: 'var(--color-forest)' },
  { name: 'Sambal 2.0 Social Security', share: 18, color: 'var(--color-plum)' },
  { name: 'MMVY & Seekho Kamao Youth', share: 12, color: 'var(--color-teal)' },
  { name: 'PM Awas Yojana (Housing)', share: 8, color: 'var(--color-marigold-dark)' }
]

const AI_POLICY_INSIGHTS = [
  {
    tag: 'Emerging Demand Surge',
    title: 'Surge in Seekho Kamao & MMSKY Youth Queries in Malwa Region',
    desc: 'Indore and Ujjain districts recorded a 42% increase in fresh ITI and Diploma graduates seeking stipend schemes. Kiosks are reporting high interest in technical certifications.',
    priority: 'High Priority'
  },
  {
    tag: 'Grievance Bottleneck Alert',
    title: 'PDS Ration Card Additions Delay in Nimar & Bundelkhand',
    desc: 'Analysis of CM Helpline 181 grievances indicates an average 8.4-day turnaround in Tehsil offices for adding newborn members to BPL ration cards, triggering automated escalation notices.',
    priority: 'Action Required'
  },
  {
    tag: 'Financial Inclusion Milestone',
    title: 'Aadhaar-NPCI Seeding Progress',
    desc: '88.4% of processed scheme applications in rural MP have active DBT bank seeding, reducing rejection rates during Mukhyamantri Kisan Kalyan disbursements by 31%.',
    priority: 'Positive Trend'
  }
]

export default function AdminDashboard({ onClose }) {
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDistricts = DISTRICT_METRICS.filter((d) =>
    d.district.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo size={34} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.adminBadge}>MPOnline GovTech Command</span>
                <span style={styles.liveIndicator}>● Live Monitoring</span>
              </div>
              <h2 style={styles.title}>Nodal Officer & GovTech Analytics Dashboard</h2>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Citizen Inquiries Processed</div>
            <div style={styles.kpiValue}>148,920</div>
            <div style={styles.kpiTrend}>▲ +18.4% this month</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Pre-filled Kiosk Applications</div>
            <div style={styles.kpiValue}>38,410</div>
            <div style={styles.kpiTrend}>▲ 89.2% OCR extraction rate</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Grievance SLA Compliance</div>
            <div style={styles.kpiValue}>94.2%</div>
            <div style={styles.kpiTrend}>Avg. resolution: 4.8 Days</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Est. Welfare Benefit Allocated</div>
            <div style={styles.kpiValue}>₹54.8 Cr</div>
            <div style={styles.kpiTrend}>Direct Benefit Transfer (DBT)</div>
          </div>
        </div>

        <div style={styles.gridSection}>
          <div style={styles.panelCard}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Madhya Pradesh District Penetration</h3>
              <input
                style={styles.searchInput}
                placeholder="Search district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>District</th>
                    <th style={styles.th}>Queries</th>
                    <th style={styles.th}>Applications</th>
                    <th style={styles.th}>Top Scheme</th>
                    <th style={styles.th}>SLA Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDistricts.map((d) => (
                    <tr key={d.district} style={styles.tr}>
                      <td style={styles.td}><strong>{d.district}</strong></td>
                      <td style={styles.td}>{d.queries.toLocaleString('en-IN')}</td>
                      <td style={styles.td}>{d.applications.toLocaleString('en-IN')}</td>
                      <td style={styles.td}>
                        <span style={styles.schemeTag}>{d.topScheme}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: parseFloat(d.slaRate) >= 94 ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                          {d.slaRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={styles.panelCard}>
              <h3 style={styles.panelTitle}>Citizen Scheme Demand Share</h3>
              <div style={styles.barContainer}>
                {SCHEME_DISTRIBUTION.map((item) => (
                  <div key={item.name} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={styles.aiSparkle}>✨</span>
                <h3 style={{ ...styles.panelTitle, margin: 0 }}>Generative AI Policy & Bottleneck Insights</h3>
              </div>
              <div style={styles.insightsList}>
                {AI_POLICY_INSIGHTS.map((insight, idx) => (
                  <div key={idx} style={styles.insightCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={styles.insightTag}>{insight.tag}</span>
                      <span style={styles.priorityBadge}>{insight.priority}</span>
                    </div>
                    <div style={styles.insightTitle}>{insight.title}</div>
                    <div style={styles.insightDesc}>{insight.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.52)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', zIndex: 60, backdropFilter: 'blur(3px)',
  },
  modal: {
    background: '#ffffff', borderRadius: '16px', padding: '24px',
    maxWidth: '920px', width: '100%', maxHeight: '92vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  adminBadge: {
    background: 'var(--color-forest)', color: '#fff', fontSize: '11px',
    fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
  },
  liveIndicator: {
    color: '#16a34a', fontSize: '11px', fontWeight: 700, background: '#dcfce7',
    padding: '3px 8px', borderRadius: '999px',
  },
  title: { margin: '4px 0 0', fontSize: '20px', color: 'var(--color-forest)', fontWeight: 700, fontFamily: 'var(--font-display)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-charcoal-soft)' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' },
  kpiCard: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px',
  },
  kpiLabel: { fontSize: '11.5px', color: '#64748b', fontWeight: 600 },
  kpiValue: { fontSize: '22px', fontWeight: 800, color: 'var(--color-forest)', margin: '4px 0 2px' },
  kpiTrend: { fontSize: '11px', color: '#16a34a', fontWeight: 600 },
  gridSection: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' },
  panelCard: {
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  panelTitle: { fontSize: '13.5px', fontWeight: 700, color: 'var(--color-forest)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  searchInput: {
    padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
    fontSize: '12px', fontFamily: 'inherit', width: '140px',
  },
  tableWrap: { maxHeight: '280px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: {
    textAlign: 'left', padding: '8px 10px', background: '#f1f5f9', color: '#475569',
    fontWeight: 700, borderBottom: '1px solid #cbd5e1', position: 'sticky', top: 0,
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 10px', color: '#334155' },
  schemeTag: {
    fontSize: '11px', background: 'var(--color-sage)', color: 'var(--color-forest)',
    padding: '2px 6px', borderRadius: '4px', fontWeight: 600,
  },
  barContainer: { display: 'flex', flexDirection: 'column' },
  barTrack: { height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' },
  aiSparkle: { fontSize: '15px' },
  insightsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  insightCard: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px',
  },
  insightTag: { fontSize: '10.5px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase' },
  priorityBadge: { fontSize: '10px', fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' },
  insightTitle: { fontSize: '12.5px', fontWeight: 700, color: '#1e293b', margin: '3px 0' },
  insightDesc: { fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 },
}
