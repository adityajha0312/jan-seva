import Logo from './Logo'
import {
  ArrowRightIcon, ShieldAlertIcon, CalculatorIcon, BarChartIcon, SearchIcon,
  AgricultureIcon, WomenEmpowermentIcon, EducationIcon, BriefcaseJobIcon, WorkerToolsIcon, SeniorPensionIcon,
  CitizenAvatarIcon,
} from './Icons'

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
    Icon: AgricultureIcon,
  },
  {
    label: 'Women Empowerment',
    sub: 'Ladli Behna, Maternity aid, Self-help groups & Safety',
    color: '#e11d48',
    tag: 'Mahila Kalyan',
    opener: 'I want to discover government schemes for women in Madhya Pradesh.',
    Icon: WomenEmpowermentIcon,
  },
  {
    label: 'Students & Scholarships',
    sub: 'Pre & Post-matric scholarships, MMVY tuition waiver',
    color: '#0284c7',
    tag: 'Shiksha',
    opener: "I'm a student looking for MP scholarship and higher education schemes.",
    Icon: EducationIcon,
  },
  {
    label: 'Youth & Employment',
    sub: 'Seekho Kamao Yojana, Startup aid & Apprenticeship',
    color: '#d97706',
    tag: 'Rojgar',
    opener: "I'm looking for youth employment, skill development, and stipend schemes.",
    Icon: BriefcaseJobIcon,
  },
  {
    label: 'Unorganized Workers',
    sub: 'Sambal 2.0, e-Shram, Accident & Social Security',
    color: '#7c3aed',
    tag: 'Shramik',
    opener: 'My family needs help with Sambal 2.0 or unorganized labor welfare.',
    Icon: WorkerToolsIcon,
  },
  {
    label: 'Senior Citizens & Pensions',
    sub: 'Old age pension, Widow pension & Geriatric health',
    color: '#475569',
    tag: 'Social Security',
    opener: "I'm a senior citizen looking for pension and healthcare benefits.",
    Icon: SeniorPensionIcon,
  },
]

const KEY_METRICS = [
  { label: 'Verified Schemes', val: '500+', badge: '100% Verified', color: '#059669' },
  { label: 'MP Districts Covered', val: '52', badge: 'Statewide', color: '#0284c7' },
  { label: 'Avg. Annual Benefit', val: '₹24,000+', badge: 'Direct DBT', color: '#f59e0b' },
  { label: 'Grievance SLA Target', val: '7 Days', badge: 'Fast Track', color: '#e11d48' },
]

export default function LandingPage({ onStart, onOpenScorecard, onOpenGrievance, onOpenAdmin }) {
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
            <span>Government of Madhya Pradesh · Citizen Welfare Portal</span>
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
              <div key={idx} style={{ ...styles.statBox, borderTop: `3px solid ${m.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <div style={styles.statVal}>{m.val}</div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: m.color, background: `${m.color}15`, padding: '2px 6px', borderRadius: '5px' }}>
                    {m.badge}
                  </span>
                </div>
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
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Jan Seva Sovereign AI Engine</span>
              </div>
              <span style={styles.liveBadge}>● LIVE MATCHING</span>
            </div>

            <div style={styles.mockChat}>
              <div style={styles.chatMessageRow}>
                <div style={styles.chatAvatarCitizen}>
                  <CitizenAvatarIcon size={18} color="#0284c7" />
                </div>
                <div style={styles.mockUserBubble}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Citizen (Voice Hindi) · Sehore</span>
                  "मैं सीहोर का किसान हूँ, 2 एकड़ ज़मीन है, मुझे कौन सी योजना मिल सकती है?"
                </div>
              </div>

              <div style={styles.chatMessageRow}>
                <div style={styles.chatAvatarAi}>
                  <Logo size={20} />
                </div>
                <div style={styles.mockAiBubble}>
                  <div style={styles.aiResultPill}>
                    <span style={{ fontSize: '12px' }}>✓</span> 2 High-Match Schemes (100% Eligible)
                  </div>
                  <div style={styles.schemeMiniRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#0f172a' }}>1. PM-KISAN + MP Kisan Kalyan</strong>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '6px' }}>₹12,000 / yr</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>Direct bank transfer (Central + MP Govt)</div>
                  </div>
                  <div style={{ ...styles.schemeMiniRow, borderBottom: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#0f172a' }}>2. Ayushman Bharat (Niramayam MP)</strong>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', background: '#f0f9ff', padding: '2px 7px', borderRadius: '6px' }}>₹5,00,000</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>Cashless family hospitalization coverage</div>
                  </div>
                  <div style={styles.mockActionRow}>
                    <button style={styles.mockActionBtn} onClick={() => onStart("I am a farmer in Sehore with 2 acres. Tell me more.")}>
                      Pre-fill MPOnline Kiosk Slip →
                    </button>
                  </div>
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
          <p style={styles.sectionDesc}>Empowering citizens across Madhya Pradesh with accessible, production-grade AI public services.</p>
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
              <SearchIcon size={22} color="#0284c7" />
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
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${cat.color}15`,
                    border: `1.5px solid ${cat.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cat.color,
                  }}
                >
                  <cat.Icon size={22} color={cat.color} />
                </div>
                <span style={{ ...styles.categoryPillTag, color: cat.color, borderColor: `${cat.color}30` }}>
                  {cat.tag}
                </span>
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
              Sovereign AI initiative for citizen empowerment. Transforming public welfare delivery through intelligent GovTech innovation.
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
          <span>Government of Madhya Pradesh · Department of Public Services</span>
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
    background: 'radial-gradient(1100px circle at 85% 12%, rgba(16, 185, 129, 0.12) 0%, rgba(240, 253, 244, 0.5) 35%, transparent 70%), radial-gradient(900px circle at 10% 45%, rgba(2, 132, 199, 0.04) 0%, transparent 60%), #f8fafc',
    color: '#0f172a',
    position: 'relative',
    overflowX: 'hidden',
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
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
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
    borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#ffffff',
    color: '#334155', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  launchChatBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
    borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '52px clamp(20px, 5vw, 60px) 68px',
    maxWidth: '1380px',
    margin: '0 auto',
    gap: 'clamp(32px, 5vw, 64px)',
    flexWrap: 'wrap',
  },
  heroTextCol: { flex: '1 1 540px', minWidth: '320px' },
  govTagPill: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
    borderRadius: '999px', background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)',
    color: '#059669', fontSize: '12px', fontWeight: 700, marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.06)',
  },
  pulseDot: {
    width: '7px', height: '7px', borderRadius: '50%', background: '#059669',
    boxShadow: '0 0 0 4px rgba(5, 150, 105, 0.2)',
  },
  heroHeadline: {
    fontSize: 'clamp(36px, 5.5vw, 56px)', fontWeight: 800, color: '#0f172a',
    lineHeight: 1.12, margin: '0 0 20px', letterSpacing: '-1.2px', fontFamily: 'var(--font-display)',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #047857 0%, #059669 45%, #0284c7 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '16.5px', lineHeight: 1.68, color: '#475569', margin: '0 0 34px',
    maxWidth: '560px',
  },
  ctaButtonGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' },
  primaryCta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 26px',
    borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 10px 24px -4px rgba(5, 150, 105, 0.42)',
  },
  scorecardBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px',
    borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#ffffff',
    color: '#0f172a', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
  },
  grievanceBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 20px',
    borderRadius: '12px', border: '1.5px solid #fecdd3', background: '#fff1f2',
    color: '#e11d48', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.06)',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
    paddingTop: '28px', borderTop: '1px solid #e2e8f0', maxWidth: '620px',
  },
  statBox: {
    background: '#ffffff', padding: '12px 14px', borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', border: '1px solid #f1f5f9',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  },
  statVal: { fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', fontFamily: 'var(--font-display)' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px', lineHeight: 1.3 },
  heroVisualCol: { flex: '1 1 420px', minWidth: '320px', display: 'flex', justifyContent: 'center' },
  showcaseCard: {
    width: '100%', maxWidth: '460px', background: '#ffffff', borderRadius: '24px',
    padding: '26px', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.16), 0 10px 25px -5px rgba(5, 150, 105, 0.10)',
    border: '1px solid rgba(226, 232, 240, 0.85)', position: 'relative',
  },
  showcaseHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px',
    paddingBottom: '14px', borderBottom: '1px solid #f1f5f9',
  },
  liveBadge: {
    fontSize: '10.5px', fontWeight: 800, color: '#059669', background: 'rgba(5, 150, 105, 0.1)',
    padding: '3px 9px', borderRadius: '999px', letterSpacing: '0.4px',
    border: '1px solid rgba(5, 150, 105, 0.2)',
  },
  mockChat: { display: 'flex', flexDirection: 'column', gap: '16px' },
  chatMessageRow: {
    display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%',
  },
  chatAvatarCitizen: {
    width: '34px', height: '34px', borderRadius: '50%', background: '#f0f9ff',
    border: '1.5px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0284c7', flexShrink: 0, boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)',
  },
  mockUserBubble: {
    background: '#f8fafc', padding: '12px 14px', borderRadius: '16px', borderTopLeftRadius: '4px',
    fontSize: '13px', color: '#1e293b', lineHeight: 1.45, border: '1px solid #e2e8f0', flex: 1,
  },
  chatAvatarAi: {
    width: '34px', height: '34px', borderRadius: '50%', background: '#ecfdf5',
    border: '1.5px solid rgba(5, 150, 105, 0.25)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
  },
  mockAiBubble: {
    background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)', padding: '16px',
    borderRadius: '18px', borderTopLeftRadius: '4px', border: '1.5px solid rgba(5, 150, 105, 0.25)',
    flex: 1, boxShadow: '0 4px 16px rgba(5, 150, 105, 0.06)',
  },
  aiResultPill: {
    fontSize: '11px', fontWeight: 700, color: '#047857', background: '#dcfce7',
    padding: '3px 9px', borderRadius: '999px', display: 'inline-block', marginBottom: '12px',
  },
  schemeMiniRow: {
    padding: '10px 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', fontSize: '13px',
  },
  mockActionRow: { marginTop: '14px' },
  mockActionBtn: {
    width: '100%', padding: '10px 14px', borderRadius: '10px', border: 'none',
    background: '#059669', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
  },
  showcaseFooter: {
    fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '16px',
    paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontWeight: 500,
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
    background: '#ffffff', borderRadius: '18px', padding: '26px',
    border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
    display: 'flex', flexDirection: 'column',
  },
  capIconWrap: {
    width: '48px', height: '48px', borderRadius: '14px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: '18px',
  },
  capTitle: { fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px', fontFamily: 'var(--font-display)' },
  capDesc: { fontSize: '13.5px', color: '#64748b', lineHeight: 1.55, margin: '0 0 18px', flex: 1 },
  capLink: {
    background: 'none', border: 'none', padding: 0, textAlign: 'left',
    color: '#059669', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '4px',
  },
  categoriesSection: {
    padding: '20px clamp(20px, 5vw, 60px) 60px', maxWidth: '1380px', margin: '0 auto', width: '100%',
  },
  categoryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px',
  },
  categoryCard: {
    background: '#ffffff', borderRadius: '18px', padding: '22px',
    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
    fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
  },
  categoryCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  categoryPillTag: {
    fontSize: '11px', fontWeight: 700, background: '#f8fafc', padding: '3px 8px', borderRadius: '999px',
    border: '1px solid #e2e8f0',
  },
  catCardTitle: { fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontFamily: 'var(--font-display)' },
  catCardSub: { fontSize: '12.5px', color: '#64748b', lineHeight: 1.45, margin: '0 0 18px', flex: 1 },
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
    background: '#ffffff', borderRadius: '18px', padding: '22px',
    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)', display: 'flex', flexDirection: 'column',
  },
  popCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  popTag: { fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px' },
  popBenefit: { fontSize: '12px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' },
  popName: { fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '6px 0 4px', fontFamily: 'var(--font-display)' },
  popBlurb: { fontSize: '12.5px', color: '#64748b', lineHeight: 1.45, margin: '0 0 16px', flex: 1 },
  popAction: { fontSize: '12.5px', fontWeight: 700, color: '#059669' },
  footer: {
    borderTop: '1px solid #e2e8f0', background: '#ffffff',
    padding: '56px clamp(20px, 5vw, 60px) 32px', marginTop: 'auto',
  },
  footerInner: {
    display: 'flex', justifyContent: 'space-between', gap: '48px', flexWrap: 'wrap',
    maxWidth: '1380px', margin: '0 auto 48px',
  },
  footerColBrand: { flex: '1 1 360px', maxWidth: '440px' },
  footerTagline: { fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginTop: '12px' },
  footerColLinks: {
    display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569',
  },
  footerBottom: {
    display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8',
    borderTop: '1px solid #f1f5f9', paddingTop: '24px', maxWidth: '1380px', margin: '0 auto', flexWrap: 'wrap', gap: '12px',
  },
}
