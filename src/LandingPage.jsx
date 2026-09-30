import { useState } from 'react'
import Logo from './Logo'
import { ArrowRightIcon, GlobeIcon, HelpCircleIcon, ShieldAlertIcon, CalculatorIcon, BarChartIcon } from './Icons'

const POPULAR_SCHEMES = [
  { name: 'PM-KISAN & Kisan Kalyan', blurb: '₹12,000/yr direct income support (Central + MP Govt)', tag: 'Farmers', color: '#059669', benefit: '₹12,000/yr' },
  { name: 'Mukhyamantri Ladli Behna', blurb: '₹15,000/yr direct bank transfer for MP women', tag: 'Women', color: '#e11d48', benefit: '₹1,250/mo' },
  { name: 'Ayushman Bharat (Niramayam MP)', blurb: 'Free cashless healthcare coverage up to ₹5 Lakh/family', tag: 'Health', color: '#0284c7', benefit: '₹5 Lakh Cover' },
  { name: 'Sambal 2.0 Social Security', blurb: 'Comprehensive aid for unorganized laborers & families', tag: 'Laborers', color: '#7c3aed', benefit: 'Maternity & Accident Aid' },
  { name: 'Mukhyamantri Seekho-Kamao (MMSKY)', blurb: 'Skill training with ₹8,000 - ₹10,000/mo government stipend', tag: 'Youth', color: '#d97706', benefit: '₹10,000/mo' },
  { name: 'PM Awas Yojana (Gramin)', blurb: 'Direct grant for building pucca houses in rural MP', tag: 'Housing', color: '#059669', benefit: 'Up to ₹2.5 Lakh' },
]

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const CATEGORIES = [
  {
    label: 'Farmers & Agriculture',
    sub: 'Kisan Kalyan, MSP, Solar Pumps & Crop Insurance',
    color: '#059669',
    tag: 'Krishi',
    opener: "I'm a farmer in MP, help me find eligible agricultural schemes.",
    icon: '🌾',
  },
  {
    label: 'Women Empowerment',
    sub: 'Ladli Behna, Maternity aid, Self-help groups & Safety',
    color: '#e11d48',
    tag: 'Mahila Kalyan',
    opener: 'I want to discover government schemes for women in Madhya Pradesh.',
    icon: '👩',
  },
  {
    label: 'Students & Scholarships',
    sub: 'Pre & Post-matric scholarships, MMVY tuition waiver',
    color: '#0284c7',
    tag: 'Shiksha',
    opener: "I'm a student looking for MP scholarship and higher education schemes.",
    icon: '🎓',
  },
  {
    label: 'Youth & Employment',
    sub: 'Seekho Kamao Yojana, Startup aid & Apprenticeship',
    color: '#d97706',
    tag: 'Rojgar',
    opener: "I'm looking for youth employment, skill development, and stipend schemes.",
    icon: '💼',
  },
  {
    label: 'Unorganized Workers',
    sub: 'Sambal 2.0, e-Shram, Accident & Social Security',
    color: '#7c3aed',
    tag: 'Shramik',
    opener: 'My family needs help with Sambal 2.0 or unorganized labor welfare.',
    icon: '🔨',
  },
  {
    label: 'Senior Citizens & Pensions',
    sub: 'Old age pension, Widow pension & Geriatric health',
    color: '#475569',
    tag: 'Social Security',
    opener: "I'm a senior citizen looking for pension and healthcare benefits.",
    icon: '👴',
  },
]

const KEY_METRICS = [
  { label: 'Verified Schemes', val: '500+' },
  { label: 'MP Districts Covered', val: '52' },
  { label: 'Avg. Annual Benefit', val: '₹24,000+' },
  { label: 'Grievance SLA Target', val: '7 Days' },
]

export default function LandingPage({ onStart, onOpenScorecard, onOpenGrievance, onOpenAdmin }) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div style={styles.page} id="top">
      {/* Top Government Tri-color subtle band */}
      <div style={styles.tricolorBand} />

      {/* Modern Header Navigation */}
      <header style={styles.navWrap}>
        <nav style={styles.nav}>
          <div style={styles.navBrand}>
            <Logo size={52} />
            <div>
              <div style={styles.brandTitleRow}>
                <span style={styles.navTitle}>Jan Seva</span>
                <span style={styles.hindiTitle}>जन सेवा</span>
                <span style={styles.betaBadge}>MPGov AI</span>
              </div>
              <div style={styles.navSubtitle}>AI-Powered Citizen Governance & Welfare Platform</div>
            </div>
          </div>

          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToSection('features') }}>Capabilities</a>
            <a href="#categories" style={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToSection('categories') }}>Beneficiaries</a>
            <a href="#popular" style={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToSection('popular') }}>Popular Schemes</a>
          </div>

          <div style={styles.navActions}>
            {onOpenAdmin && (
              <button style={styles.adminNavBtn} onClick={onOpenAdmin}>
                <BarChartIcon size={14} color="#059669" />
                <span>Nodal Officer Portal</span>
              </button>
            )}
            <button className="ym-cta" style={styles.launchChatBtn} onClick={() => onStart()}>
              <span>Ask Jan Seva AI</span>
              <ArrowRightIcon size={14} color="#ffffff" />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={styles.hero}>
        <div style={styles.heroTextCol}>
          <div style={styles.govTagPill}>
            <span style={styles.pulseDot} />
            <span>MPOnline Hackathon · Challenge 5 Official Entry</span>
          </div>

          <h1 style={styles.heroHeadline}>
            Sovereign AI for <br />
            <span style={styles.gradientText}>Every Citizen of MP</span>
          </h1>

          <p style={styles.heroSubtitle}>
            <strong>Jan Seva (जन सेवा)</strong> redefines digital public service delivery. 
            Discover entitled welfare schemes in your mother tongue, calculate instant eligibility with Explainable AI, 
            auto-draft legal petitions for <strong>CM Helpline 181</strong>, and print kiosk-ready applications with dynamic QR verification.
          </p>

          {/* Action CTAs */}
          <div style={styles.ctaButtonGroup}>
            <button className="ym-cta" style={styles.primaryCta} onClick={() => onStart()}>
              <span>Discover My Schemes</span>
              <ArrowRightIcon size={16} color="#ffffff" />
            </button>

            {onOpenScorecard && (
              <button className="ym-cta" style={styles.scorecardBtn} onClick={onOpenScorecard}>
                <CalculatorIcon size={16} color="#0f172a" />
                <span>Eligibility Scorecard</span>
              </button>
            )}

            {onOpenGrievance && (
              <button style={styles.grievanceBtn} onClick={onOpenGrievance}>
                <ShieldAlertIcon size={16} color="#e11d48" />
                <span>CM Helpline 181</span>
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div style={styles.statsRow}>
            {KEY_METRICS.map((m, idx) => (
              <div key={idx} style={styles.statBox}>
                <div style={styles.statVal}>{m.val}</div>
                <div style={styles.statLabel}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Interactive Showcase Card */}
        <div style={styles.heroVisualCol}>
          <div style={styles.showcaseCard}>
            <div style={styles.showcaseHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Jan Seva Sovereign AI Engine</span>
              </div>
              <span style={styles.liveBadge}>LIVE MATCHING</span>
            </div>

            <div style={styles.mockChat}>
              <div style={styles.mockUserBubble}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Citizen (Voice Hindi):</span>
                "मैं सीहोर का किसान हूँ, 2 एकड़ ज़मीन है, मुझे कौन सी योजना मिल सकती है?"
              </div>

              <div style={styles.mockAiBubble}>
                <div style={styles.aiResultPill}>✅ 2 High-Match Schemes Identified (100% Eligible)</div>
                <div style={styles.schemeMiniRow}>
                  <strong>1. PM-KISAN + MP Kisan Kalyan</strong>
                  <div style={{ color: '#059669', fontSize: '12px', fontWeight: 700 }}>₹12,000 / year direct bank transfer</div>
                </div>
                <div style={styles.schemeMiniRow}>
                  <strong>2. Ayushman Bharat (Niramayam MP)</strong>
                  <div style={{ color: '#0284c7', fontSize: '12px', fontWeight: 700 }}>₹5,00,000 Cashless Family Health Cover</div>
                </div>
                <div style={styles.mockActionRow}>
                  <button style={styles.mockActionBtn} onClick={() => onStart("I am a farmer in Sehore with 2 acres. Tell me more.")}>
                    Pre-fill MPOnline Kiosk Slip →
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.showcaseFooter}>
              <span>🔒 100% In-memory OCR · Multilingual Voice · Offline Resilient</span>
            </div>
          </div>
        </div>
      </main>

      {/* Core AI Capabilities Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionHeaderWrap}>
          <span style={styles.sectionBadge}>ENTERPRISE GOVTECH</span>
          <h2 style={styles.sectionHeading}>Engineered for Citizen-Centric Governance</h2>
          <p style={styles.sectionDesc}>Hitting every benchmark of the MPOnline Hackathon Challenge with production-grade AI.</p>
        </div>

        <div style={styles.capabilitiesGrid}>
          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrap, background: '#ecfdf5', color: '#059669' }}>
              <CalculatorIcon size={22} color="#059669" />
            </div>
            <h3 style={styles.capTitle}>Explainable AI Eligibility Scorecard</h3>
            <p style={styles.capDesc}>
              Transparent rule-engine scoring that tells citizens precisely *why* they qualify with green criteria ticks and calculates cumulative annual welfare benefits.
            </p>
            <button style={styles.capLink} onClick={onOpenScorecard}>Try Scorecard Calculator →</button>
          </div>

          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrap, background: '#fff1f2', color: '#e11d48' }}>
              <ShieldAlertIcon size={22} color="#e11d48" />
            </div>
            <h3 style={styles.capTitle}>CM Helpline 181 Grievance Redressal</h3>
            <p style={styles.capDesc}>
              Converts colloquial voice grievances into formal legal memorandums citing the MP Public Service Guarantee Act 2010, auto-routed with a 7-day statutory resolution target.
            </p>
            <button style={styles.capLink} onClick={onOpenGrievance}>Lodge CM Helpline 181 →</button>
          </div>

          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrap, background: '#f0f9ff', color: '#0284c7' }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
            </div>
            <h3 style={styles.capTitle}>Computer Vision OCR & Verification</h3>
            <p style={styles.capDesc}>
              Instant extraction from uploaded Aadhaar, Samagra ID, and Khasra records. Analyzes document readiness, checks digit checksums, and flags errors before kiosk submission.
            </p>
            <button style={styles.capLink} onClick={() => onStart()}>Test Vision OCR →</button>
          </div>

          <div style={styles.capCard}>
            <div style={{ ...styles.capIconWrap, background: '#f5f3ff', color: '#7c3aed' }}>
              <BarChartIcon size={22} color="#7c3aed" />
            </div>
            <h3 style={styles.capTitle}>Nodal Officer Intelligence Hub</h3>
            <p style={styles.capDesc}>
              Government dashboard for MPOnline officials to monitor district-level penetration, identify departmental grievance bottlenecks, and read AI policy insights.
            </p>
            {onOpenAdmin && <button style={styles.capLink} onClick={onOpenAdmin}>Open Nodal Command Center →</button>}
          </div>
        </div>
      </section>

      {/* Target Beneficiary Categories */}
      <section id="categories" style={styles.categoriesSection}>
        <div style={styles.sectionHeaderWrap}>
          <span style={styles.sectionBadge}>EXPLORE BY CITIZEN PROFILE</span>
          <h2 style={styles.sectionHeading}>Who are you looking for?</h2>
          <p style={styles.sectionDesc}>Tap your segment to start an AI consultation tailored to your family's exact needs.</p>
        </div>

        <div style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              style={styles.categoryCard}
              className="ym-category-card"
              onClick={() => onStart(cat.opener)}
            >
              <div style={styles.categoryCardTop}>
                <span style={styles.categoryEmoji}>{cat.icon}</span>
                <span style={{ ...styles.categoryPillTag, color: cat.color }}>{cat.tag}</span>
              </div>
              <h4 style={styles.catCardTitle}>{cat.label}</h4>
              <p style={styles.catCardSub}>{cat.sub}</p>
              <div style={styles.catCardArrow}>
                <span>Explore Schemes</span>
                <ArrowRightIcon size={14} color="#059669" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Popular MP Schemes Grid */}
      <section id="popular" style={styles.popularSection}>
        <div style={styles.sectionHeaderWrap}>
          <span style={styles.sectionBadge}>FLAGSHIP MP & CENTRAL SCHEMES</span>
          <h2 style={styles.sectionHeading}>High-Impact Welfare Programs</h2>
        </div>

        <div style={styles.popularGrid}>
          {POPULAR_SCHEMES.map((scheme) => (
            <button
              key={scheme.name}
              style={styles.popularCard}
              className="ym-category-card"
              onClick={() => onStart(`Tell me about ${scheme.name} and how I can apply.`)}
            >
              <div style={styles.popCardHeader}>
                <span style={{ ...styles.popTag, background: `${scheme.color}15`, color: scheme.color }}>
                  {scheme.tag}
                </span>
                <span style={styles.popBenefit}>{scheme.benefit}</span>
              </div>
              <h4 style={styles.popName}>{scheme.name}</h4>
              <p style={styles.popBlurb}>{scheme.blurb}</p>
              <div style={styles.popAction}>Apply via Jan Seva →</div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerColBrand}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Logo size={42} />
              <strong style={{ fontSize: '18px', color: '#0f172a' }}>Jan Seva (जन सेवा)</strong>
            </div>
            <p style={styles.footerTagline}>
              Sovereign AI initiative for MPOnline Hackathon 2026. Transforming citizen welfare delivery through intelligent GovTech innovation.
            </p>
          </div>

          <div style={styles.footerColLinks}>
            <strong>Citizen Portals</strong>
            <a href="#top" onClick={() => onStart()}>Jan Seva Chat</a>
            <a href="#top" onClick={onOpenScorecard}>Eligibility Scorecard</a>
            <a href="#top" onClick={onOpenGrievance}>CM Helpline 181</a>
          </div>

          <div style={styles.footerColLinks}>
            <strong>Governance</strong>
            {onOpenAdmin && <a href="#top" onClick={onOpenAdmin}>Nodal Officer Portal</a>}
            <a href="https://mponline.gov.in" target="_blank" rel="noreferrer">MPOnline Portal</a>
            <a href="https://cmhelpline.mp.gov.in" target="_blank" rel="noreferrer">CM Helpline 181 Official</a>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <span>Government of Madhya Pradesh · MPOnline Challenge 5</span>
          <span>Aligned with MP Public Services Guarantee Act 2010</span>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-body)',
    background: '#f8fafc',
    color: '#0f172a',
    position: 'relative',
  },
  tricolorBand: {
    height: '4px',
    background: 'linear-gradient(90deg, #f59e0b 0%, #ffffff 50%, #059669 100%)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navWrap: {
    position: 'sticky',
    top: '4px',
    zIndex: 50,
    background: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px clamp(20px, 5vw, 60px)',
    maxWidth: '1380px',
    margin: '0 auto',
    gap: '16px',
    flexWrap: 'wrap',
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandTitleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  navTitle: { fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', fontFamily: 'var(--font-display)' },
  hindiTitle: { fontSize: '15px', color: '#059669', fontWeight: 700 },
  betaBadge: {
    fontSize: '10px', fontWeight: 700, background: 'rgba(5, 150, 105, 0.1)',
    color: '#059669', padding: '2px 7px', borderRadius: '999px',
  },
  navSubtitle: { fontSize: '11px', color: '#64748b', fontWeight: 500 },
  navLinks: { display: 'flex', gap: '28px' },
  navLink: { color: '#334155', textDecoration: 'none', fontSize: '13.5px', fontWeight: 600, transition: 'color 0.2s' },
  navActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  adminNavBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
    borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff',
    color: '#334155', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  launchChatBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
    borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '48px clamp(20px, 5vw, 60px) 60px',
    maxWidth: '1380px',
    margin: '0 auto',
    gap: 'clamp(30px, 5vw, 64px)',
    flexWrap: 'wrap',
  },
  heroTextCol: { flex: '1 1 540px', minWidth: '320px' },
  govTagPill: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
    borderRadius: '999px', background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.2)',
    color: '#059669', fontSize: '12px', fontWeight: 700, marginBottom: '20px',
  },
  pulseDot: {
    width: '7px', height: '7px', borderRadius: '50%', background: '#059669',
    boxShadow: '0 0 0 4px rgba(5, 150, 105, 0.2)',
  },
  heroHeadline: {
    fontSize: 'clamp(36px, 5.5vw, 56px)', fontWeight: 800, color: '#0f172a',
    lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1px', fontFamily: 'var(--font-display)',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #059669 0%, #0284c7 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '16.5px', lineHeight: 1.65, color: '#475569', margin: '0 0 32px',
    maxWidth: '560px',
  },
  ctaButtonGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' },
  primaryCta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 26px',
    borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 10px 25px -4px rgba(5, 150, 105, 0.4)',
  },
  scorecardBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px',
    borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#ffffff',
    color: '#0f172a', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  grievanceBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 20px',
    borderRadius: '12px', border: '1.5px solid #fecdd3', background: '#fff1f2',
    color: '#e11d48', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
    paddingTop: '24px', borderTop: '1px solid #e2e8f0', maxWidth: '580px',
  },
  statBox: {},
  statVal: { fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' },
  statLabel: { fontSize: '11.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' },
  heroVisualCol: { flex: '1 1 420px', minWidth: '320px', display: 'flex', justifyContent: 'center' },
  showcaseCard: {
    width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '20px',
    padding: '24px', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.15)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
  },
  showcaseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  liveBadge: {
    fontSize: '10px', fontWeight: 800, color: '#059669', background: '#ecfdf5',
    padding: '3px 8px', borderRadius: '999px', letterSpacing: '0.4px',
  },
  mockChat: { display: 'flex', flexDirection: 'column', gap: '14px' },
  mockUserBubble: {
    background: '#f1f5f9', padding: '12px 14px', borderRadius: '14px', fontSize: '13.5px',
    color: '#1e293b', lineHeight: 1.4, alignSelf: 'flex-start', border: '1px solid #e2e8f0',
  },
  mockAiBubble: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
    padding: '16px', borderRadius: '16px', border: '1.5px solid rgba(5, 150, 105, 0.25)',
  },
  aiResultPill: {
    fontSize: '11px', fontWeight: 700, color: '#047857', background: '#dcfce7',
    padding: '3px 8px', borderRadius: '999px', display: 'inline-block', marginBottom: '10px',
  },
  schemeMiniRow: {
    padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px',
  },
  mockActionRow: { marginTop: '12px' },
  mockActionBtn: {
    width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
    background: '#059669', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
  },
  showcaseFooter: {
    fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '16px',
    paddingTop: '12px', borderTop: '1px solid #f1f5f9',
  },
  featuresSection: {
    padding: '60px clamp(20px, 5vw, 60px)', maxWidth: '1380px', margin: '0 auto', width: '100%',
  },
  sectionHeaderWrap: { textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' },
  sectionBadge: {
    fontSize: '11px', fontWeight: 800, color: '#059669', background: 'rgba(5, 150, 105, 0.1)',
    padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.6px',
  },
  sectionHeading: {
    fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#0f172a',
    margin: '10px 0 8px', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)',
  },
  sectionDesc: { fontSize: '15px', color: '#64748b', margin: 0, lineHeight: 1.5 },
  capabilitiesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px',
  },
  capCard: {
    background: '#ffffff', borderRadius: '16px', padding: '24px',
    border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    display: 'flex', flexDirection: 'column',
  },
  capIconWrap: {
    width: '46px', height: '46px', borderRadius: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
  },
  capTitle: { fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' },
  capDesc: { fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px', flex: 1 },
  capLink: {
    background: 'none', border: 'none', padding: 0, textAlign: 'left',
    color: '#059669', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  categoriesSection: {
    padding: '20px clamp(20px, 5vw, 60px) 60px', maxWidth: '1380px', margin: '0 auto', width: '100%',
  },
  categoryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px',
  },
  categoryCard: {
    background: '#ffffff', borderRadius: '16px', padding: '20px',
    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
    fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
  },
  categoryCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  categoryEmoji: { fontSize: '28px' },
  categoryPillTag: {
    fontSize: '11px', fontWeight: 700, background: '#f8fafc', padding: '3px 8px', borderRadius: '999px',
    border: '1px solid #e2e8f0',
  },
  catCardTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' },
  catCardSub: { fontSize: '12.5px', color: '#64748b', lineHeight: 1.4, margin: '0 0 16px', flex: 1 },
  catCardArrow: {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px',
    fontWeight: 700, color: '#059669',
  },
  popularSection: {
    padding: '20px clamp(20px, 5vw, 60px) 70px', maxWidth: '1380px', margin: '0 auto', width: '100%',
  },
  popularGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px',
  },
  popularCard: {
    background: '#ffffff', borderRadius: '16px', padding: '20px',
    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
  },
  popCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  popTag: { fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px' },
  popBenefit: { fontSize: '11.5px', fontWeight: 700, color: '#059669' },
  popName: { fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '6px 0 4px' },
  popBlurb: { fontSize: '12.5px', color: '#64748b', lineHeight: 1.4, margin: '0 0 14px' },
  popAction: { fontSize: '12.5px', fontWeight: 700, color: '#059669' },
  footer: {
    borderTop: '1px solid #e2e8f0', background: '#ffffff',
    padding: '50px clamp(20px, 5vw, 60px) 30px', marginTop: 'auto',
  },
  footerInner: {
    display: 'flex', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap',
    maxWidth: '1380px', margin: '0 auto 40px',
  },
  footerColBrand: { flex: '1 1 360px', maxWidth: '420px' },
  footerTagline: { fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginTop: '10px' },
  footerColLinks: {
    display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569',
  },
  footerBottom: {
    display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8',
    borderTop: '1px solid #f1f5f9', paddingTop: '20px', maxWidth: '1380px', margin: '0 auto', flexWrap: 'wrap', gap: '10px',
  },
}
