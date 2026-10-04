import Logo from './Logo'
import {
  ArrowRightIcon, ShieldAlertIcon, CalculatorIcon, BarChartIcon, SearchIcon,
  AgricultureIcon, WomenEmpowermentIcon, EducationIcon, BriefcaseJobIcon, WorkerToolsIcon, SeniorPensionIcon,
} from './Icons'

function CitizenAvatarIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20.5C4.5 16.634 7.85786 13.5 12 13.5C16.1421 13.5 19.5 16.634 19.5 20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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

export default function LandingPage({ onStart, onOpenScorecard, onOpenGrievance, onOpenAdmin, onOpenRojgarRadar, onOpenDocVerification }) {
  return (
    <div style={styles.page} id="top">
      {/* Top Government Tri-color subtle band */}
      <div style={styles.tricolorBand} />

      {/* Modern Header Navigation */}
      <header style={styles.navWrap} className="ym-landing-header">
        <nav style={styles.nav} className="ym-landing-nav">
          <div style={styles.navBrand} className="ym-landing-brand">
            <div className="ym-landing-brand-logo">
              <Logo size={48} />
            </div>
            <div>
              <div style={styles.brandTitleRow}>
                <span style={styles.navTitle}>Jan Seva</span>
                <span style={styles.hindiTitle}>जन सेवा</span>
                <span style={styles.betaBadge}>MPGov AI</span>
              </div>
              <div style={styles.navSubtitle} className="ym-landing-brand-sub">
                AI-Powered Citizen Governance & Welfare Platform
              </div>
            </div>
          </div>

          <div style={styles.navLinks} className="ym-landing-nav-links">
            <a href="#features" style={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToSection('features') }}>Capabilities</a>
            <a href="#categories" style={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToSection('categories') }}>Beneficiaries</a>
            <a href="#popular" style={styles.navLink} onClick={(e) => { e.preventDefault(); scrollToSection('popular') }}>Popular Schemes</a>
          </div>

          <div style={styles.navActions} className="ym-landing-nav-actions">
            {onOpenDocVerification && (
              <button
                style={styles.ocrNavBtn}
                className="ym-landing-ocr-btn"
                onClick={onOpenDocVerification}
                title="Computer Vision OCR - Document Verification"
              >
                <span style={{ fontSize: '14px' }}>📷</span>
                <span>Document OCR</span>
              </button>
            )}
            {onOpenAdmin && (
              <button
                style={styles.adminNavBtn}
                className="ym-landing-admin-btn"
                onClick={onOpenAdmin}
              >
                <BarChartIcon size={14} color="#059669" />
                <span>Nodal Officer Portal</span>
              </button>
            )}
            <button
              className="ym-cta ym-landing-chat-btn"
              style={styles.launchChatBtn}
              onClick={() => onStart()}
            >
              <span>Ask Jan Seva AI</span>
              <ArrowRightIcon size={14} color="#ffffff" />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={styles.hero} className="ym-landing-hero">
        <div style={styles.heroTextCol} className="ym-landing-hero-text">
          <div style={styles.govTagPill} className="ym-landing-gov-pill">
            <span style={styles.pulseDot} />
            <span>Government of Madhya Pradesh · Citizen Welfare Portal</span>
          </div>

          <h1 style={styles.heroHeadline} className="ym-landing-headline">
            Sovereign AI for <br />
            <span style={styles.gradientText}>Every Citizen of MP</span>
          </h1>

          <p style={styles.heroSubtitle} className="ym-landing-subtitle">
            <strong>Jan Seva (जन सेवा)</strong> redefines digital public service delivery. 
            Discover entitled welfare schemes in your mother tongue, calculate instant eligibility with Explainable AI, 
            auto-draft legal petitions for <strong>CM Helpline 181</strong>, and print kiosk-ready applications with dynamic QR verification.
          </p>

          {/* Action CTAs */}
          <div style={styles.ctaButtonGroup} className="ym-landing-cta-group">
            <button className="ym-cta ym-landing-cta-btn" style={styles.primaryCta} onClick={() => onStart()}>
              <span>Discover My Schemes</span>
              <ArrowRightIcon size={16} color="#ffffff" />
            </button>

            {onOpenDocVerification && (
              <button className="ym-cta ym-landing-cta-btn" style={styles.ocrBtn} onClick={onOpenDocVerification} title="Computer Vision OCR - Document Verification">
                <span style={{ fontSize: '16px' }}>📷</span>
                <span>Verify Documents (OCR)</span>
              </button>
            )}

            {onOpenScorecard && (
              <button className="ym-cta ym-landing-cta-btn" style={styles.scorecardBtn} onClick={onOpenScorecard}>
                <CalculatorIcon size={16} color="#0f172a" />
                <span>Eligibility Scorecard</span>
              </button>
            )}

            {onOpenRojgarRadar && (
              <button className="ym-cta ym-landing-cta-btn" style={styles.rojgarBtn} onClick={onOpenRojgarRadar}>
                <BriefcaseJobIcon size={16} color="#d97706" />
                <span>Rojgar & Scholarships</span>
              </button>
            )}

            {onOpenGrievance && (
              <button className="ym-cta ym-landing-cta-btn" style={styles.grievanceBtn} onClick={onOpenGrievance}>
                <ShieldAlertIcon size={16} color="#e11d48" />
                <span>CM Helpline 181</span>
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div style={styles.statsRow} className="ym-landing-stats-row">
            {KEY_METRICS.map((m, idx) => (
              <div key={idx} className="ym-landing-stat-box" style={{ ...styles.statBox, borderTop: `3px solid ${m.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <div style={styles.statVal} className="ym-landing-stat-val">{m.val}</div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: m.color, background: `${m.color}15`, padding: '2px 6px', borderRadius: '5px' }}>
                    {m.badge}
                  </span>
                </div>
                <div style={styles.statLabel} className="ym-landing-stat-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Interactive Showcase Card */}
        <div style={styles.heroVisualCol} className="ym-landing-hero-visual">
          <div style={styles.showcaseCard} className="ym-landing-showcase-card">
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>1. PM-KISAN + MP Kisan Kalyan</strong>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '6px' }}>₹12,000 / yr</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>Direct bank transfer (Central + MP Govt)</div>
                  </div>
                  <div style={{ ...styles.schemeMiniRow, borderBottom: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#0f172a', fontSize: '12.5px' }}>2. Ayushman Bharat (Niramayam MP)</strong>
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
      <section id="features" style={styles.featuresSection} className="ym-landing-section">
        <div style={styles.sectionHeaderWrap}>
          <span style={styles.sectionBadge}>ENTERPRISE GOVTECH</span>
          <h2 style={styles.sectionHeading}>Engineered for Citizen-Centric Governance</h2>
          <p style={styles.sectionDesc}>Empowering citizens across Madhya Pradesh with accessible, production-grade AI public services.</p>
        </div>

        <div style={styles.capabilitiesGrid} className="ym-landing-cap-grid">
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
            <div style={{ ...styles.capIconWrap, background: '#fffbeb', color: '#d97706' }}>
              <BriefcaseJobIcon size={22} color="#d97706" />
            </div>
            <h3 style={styles.capTitle}>AI Sarkari Rojgar & Scholarship Radar</h3>
            <p style={styles.capDesc}>
              Real-time matching for MP Government Recruitments (ESB / Patwari / Police), MMVY 100% higher education tuition fee waivers, and MMSKY skill stipends (up to ₹10,000/mo).
            </p>
            <button style={{ ...styles.capLink, color: '#d97706' }} onClick={onOpenRojgarRadar || (() => onStart('Tell me about MP government jobs and scholarships'))}>
              Launch Rojgar Radar →
            </button>
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
            <button style={styles.capLink} onClick={onOpenDocVerification || (() => onStart('Help me verify my documents for government schemes'))}>Test Vision OCR →</button>
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
      <section id="categories" style={styles.categoriesSection} className="ym-landing-section">
        <div style={styles.sectionHeaderWrap}>
          <span style={styles.sectionBadge}>EXPLORE BY CITIZEN PROFILE</span>
          <h2 style={styles.sectionHeading}>Who are you looking for?</h2>
          <p style={styles.sectionDesc}>Tap your segment to start an AI consultation tailored to your family's exact needs.</p>
        </div>

        <div style={styles.categoryGrid} className="ym-landing-cat-grid">
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
      <section id="popular" style={styles.popularSection} className="ym-landing-section">
        <div style={styles.sectionHeaderWrap}>
          <span style={styles.sectionBadge}>FLAGSHIP MP & CENTRAL SCHEMES</span>
          <h2 style={styles.sectionHeading}>High-Impact Welfare Programs</h2>
        </div>

        <div style={styles.popularGrid} className="ym-landing-pop-grid">
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
      <footer style={styles.footer} className="ym-landing-footer">
        <div style={styles.footerInner} className="ym-landing-footer-inner">
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

        <div style={styles.footerBottom} className="ym-landing-footer-bottom">
          <span>Government of Madhya Pradesh · Department of Public Services</span>
          <span>Aligned with MP Public Services Guarantee Act 2010</span>
        </div>
      </footer>

      {/* Bulletproof Responsive Styles for Phones & Small Screens */}
      <style>{`
        @media (max-width: 860px) {
          .ym-landing-nav {
            padding: 10px 14px !important;
            gap: 8px !important;
          }
          .ym-landing-brand-logo svg {
            width: 36px !important;
            height: 36px !important;
          }
          .ym-landing-brand-sub {
            display: none !important;
          }
          .ym-landing-nav-links {
            display: none !important;
          }
          .ym-landing-admin-btn {
            display: none !important;
          }
          .ym-landing-ocr-btn {
            padding: 7px 10px !important;
            font-size: 11.5px !important;
          }
          .ym-landing-chat-btn {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          .ym-landing-hero {
            padding: 22px 14px 36px !important;
            flex-direction: column !important;
            gap: 28px !important;
          }
          .ym-landing-hero-text,
          .ym-landing-hero-visual {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .ym-landing-gov-pill {
            font-size: 11px !important;
            padding: 5px 10px !important;
            line-height: 1.3 !important;
            white-space: normal !important;
            margin-bottom: 14px !important;
            max-width: 100% !important;
          }
          .ym-landing-headline {
            font-size: clamp(27px, 7.5vw, 36px) !important;
            line-height: 1.15 !important;
            letter-spacing: -0.8px !important;
            margin-bottom: 14px !important;
            word-break: break-word !important;
          }
          .ym-landing-subtitle {
            font-size: 14px !important;
            line-height: 1.55 !important;
            margin-bottom: 22px !important;
            max-width: 100% !important;
          }
          .ym-landing-cta-group {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 10px !important;
            margin-bottom: 28px !important;
          }
          .ym-landing-cta-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 13px 16px !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
            text-align: center !important;
          }
          .ym-landing-stats-row {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            width: 100% !important;
            max-width: 100% !important;
            padding-top: 18px !important;
          }
          .ym-landing-stat-box {
            padding: 10px 10px !important;
            min-width: 0 !important;
          }
          .ym-landing-stat-val {
            font-size: 18px !important;
          }
          .ym-landing-stat-label {
            font-size: 10px !important;
          }
          .ym-landing-showcase-card {
            padding: 16px 12px !important;
            border-radius: 18px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .ym-landing-section {
            padding: 36px 14px !important;
          }
          .ym-landing-cap-grid,
          .ym-landing-cat-grid,
          .ym-landing-pop-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .ym-landing-footer {
            padding: 36px 14px 24px !important;
          }
          .ym-landing-footer-inner {
            flex-direction: column !important;
            gap: 24px !important;
            margin-bottom: 24px !important;
          }
          .ym-landing-footer-bottom {
            flex-direction: column !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-body)',
    background: 'radial-gradient(1100px circle at 85% 12%, rgba(16, 185, 129, 0.12) 0%, rgba(240, 253, 244, 0.5) 35%, transparent 70%), radial-gradient(900px circle at 10% 45%, rgba(2, 132, 199, 0.04) 0%, transparent 60%), #f8fafc',
    color: '#0f172a',
    position: 'relative',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  tricolorBand: {
    height: '4px',
    background: 'linear-gradient(90deg, #f59e0b 0%, #ffffff 50%, #059669 100%)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navWrap: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    position: 'sticky',
    top: 0,
    zIndex: 90,
    width: '100%',
    boxSizing: 'border-box',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px clamp(16px, 4vw, 60px)',
    maxWidth: '1380px',
    margin: '0 auto',
    gap: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  brandTitleRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  navTitle: { fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' },
  hindiTitle: { fontSize: '14.5px', color: '#059669', fontWeight: 700, whiteSpace: 'nowrap' },
  betaBadge: {
    fontSize: '10px', fontWeight: 700, background: 'rgba(5, 150, 105, 0.1)',
    color: '#059669', padding: '2px 7px', borderRadius: '999px', whiteSpace: 'nowrap',
  },
  navSubtitle: { fontSize: '11px', color: '#64748b', fontWeight: 500 },
  navLinks: { display: 'flex', gap: '24px', alignItems: 'center' },
  navLink: { color: '#334155', textDecoration: 'none', fontSize: '13.5px', fontWeight: 600, transition: 'color 0.2s', whiteSpace: 'nowrap' },
  navActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  adminNavBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
    borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#ffffff',
    color: '#334155', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)', whiteSpace: 'nowrap',
  },
  ocrNavBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
    borderRadius: '10px', border: '1.5px solid #bae6fd', background: '#f0f9ff',
    color: '#0284c7', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)', whiteSpace: 'nowrap',
  },
  launchChatBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
    borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)', whiteSpace: 'nowrap',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '48px clamp(16px, 4vw, 60px) 60px',
    maxWidth: '1380px',
    margin: '0 auto',
    gap: 'clamp(28px, 4vw, 56px)',
    flexWrap: 'wrap',
    width: '100%',
    boxSizing: 'border-box',
  },
  heroTextCol: {
    flex: '1 1 520px',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  govTagPill: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
    borderRadius: '999px', background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)',
    color: '#059669', fontSize: '12px', fontWeight: 700, marginBottom: '18px',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.06)',
  },
  pulseDot: {
    width: '7px', height: '7px', borderRadius: '50%', background: '#059669',
    boxShadow: '0 0 0 4px rgba(5, 150, 105, 0.2)',
  },
  heroHeadline: {
    fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, color: '#0f172a',
    lineHeight: 1.12, margin: '0 0 18px', letterSpacing: '-1.2px', fontFamily: 'var(--font-display)',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #047857 0%, #059669 45%, #0284c7 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '16px', lineHeight: 1.65, color: '#475569', margin: '0 0 32px',
    maxWidth: '560px',
  },
  ctaButtonGroup: {
    display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px',
    width: '100%', boxSizing: 'border-box',
  },
  primaryCta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px',
    borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 10px 24px -4px rgba(5, 150, 105, 0.42)', whiteSpace: 'nowrap',
  },
  ocrBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px',
    borderRadius: '12px', border: '1.5px solid #bae6fd', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    color: '#0369a1', fontSize: '14.5px', fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(2, 132, 199, 0.15)', whiteSpace: 'nowrap',
  },
  scorecardBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px',
    borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#ffffff',
    color: '#0f172a', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)', whiteSpace: 'nowrap',
  },
  rojgarBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px',
    borderRadius: '12px', border: '1.5px solid #fde68a', background: '#fffbeb',
    color: '#d97706', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)', whiteSpace: 'nowrap',
  },
  grievanceBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 20px',
    borderRadius: '12px', border: '1.5px solid #fecdd3', background: '#fff1f2',
    color: '#e11d48', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.06)', whiteSpace: 'nowrap',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
    paddingTop: '26px', borderTop: '1px solid #e2e8f0', maxWidth: '620px',
    width: '100%', boxSizing: 'border-box',
  },
  statBox: {
    background: '#ffffff', padding: '12px 14px', borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', border: '1px solid #f1f5f9',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    minWidth: 0, boxSizing: 'border-box',
  },
  statVal: { fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', fontFamily: 'var(--font-display)' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px', lineHeight: 1.3 },
  heroVisualCol: {
    flex: '1 1 400px',
    minWidth: 0,
    maxWidth: '100%',
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  showcaseCard: {
    width: '100%', maxWidth: '460px', background: '#ffffff', borderRadius: '24px',
    padding: '24px', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.16), 0 10px 25px -5px rgba(5, 150, 105, 0.10)',
    border: '1px solid rgba(226, 232, 240, 0.85)', position: 'relative',
    boxSizing: 'border-box',
  },
  showcaseHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
    paddingBottom: '12px', borderBottom: '1px solid #f1f5f9',
  },
  liveBadge: {
    fontSize: '10px', fontWeight: 800, color: '#059669', background: 'rgba(5, 150, 105, 0.1)',
    padding: '3px 8px', borderRadius: '999px', letterSpacing: '0.4px',
    border: '1px solid rgba(5, 150, 105, 0.2)',
  },
  mockChat: { display: 'flex', flexDirection: 'column', gap: '14px' },
  chatMessageRow: {
    display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%',
  },
  chatAvatarCitizen: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#f0f9ff',
    border: '1.5px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0284c7', flexShrink: 0, boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)',
  },
  mockUserBubble: {
    background: '#f8fafc', padding: '11px 13px', borderRadius: '15px', borderTopLeftRadius: '4px',
    fontSize: '13px', color: '#1e293b', lineHeight: 1.45, border: '1px solid #e2e8f0', flex: 1, minWidth: 0,
  },
  chatAvatarAi: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5',
    border: '1.5px solid rgba(5, 150, 105, 0.25)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
  },
  mockAiBubble: {
    background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)', padding: '14px',
    borderRadius: '16px', borderTopLeftRadius: '4px', border: '1.5px solid rgba(5, 150, 105, 0.25)',
    flex: 1, minWidth: 0, boxShadow: '0 4px 16px rgba(5, 150, 105, 0.06)',
  },
  aiResultPill: {
    fontSize: '11px', fontWeight: 700, color: '#047857', background: '#dcfce7',
    padding: '3px 9px', borderRadius: '999px', display: 'inline-block', marginBottom: '10px',
  },
  schemeMiniRow: {
    padding: '8px 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', fontSize: '13px',
  },
  mockActionRow: { marginTop: '12px' },
  mockActionBtn: {
    width: '100%', padding: '10px 14px', borderRadius: '10px', border: 'none',
    background: '#059669', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
  },
  showcaseFooter: {
    fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '14px',
    paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontWeight: 500,
  },
  featuresSection: {
    padding: '52px clamp(16px, 4vw, 60px)', maxWidth: '1380px', margin: '0 auto', width: '100%', boxSizing: 'border-box',
  },
  sectionHeaderWrap: { textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' },
  sectionBadge: {
    fontSize: '11px', fontWeight: 800, color: '#059669', background: 'rgba(5, 150, 105, 0.1)',
    padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.6px',
  },
  sectionHeading: {
    fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a',
    margin: '10px 0 8px', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)',
  },
  sectionDesc: { fontSize: '14.5px', color: '#64748b', margin: 0, lineHeight: 1.5 },
  capabilitiesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px',
    width: '100%', boxSizing: 'border-box',
  },
  capCard: {
    background: '#ffffff', borderRadius: '18px', padding: '24px',
    border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
    display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
  },
  capIconWrap: {
    width: '46px', height: '46px', borderRadius: '13px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
  },
  capTitle: { fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontFamily: 'var(--font-display)' },
  capDesc: { fontSize: '13px', color: '#64748b', lineHeight: 1.55, margin: '0 0 16px', flex: 1 },
  capLink: {
    background: 'none', border: 'none', padding: 0, textAlign: 'left',
    color: '#059669', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '4px',
  },
  categoriesSection: {
    padding: '20px clamp(16px, 4vw, 60px) 52px', maxWidth: '1380px', margin: '0 auto', width: '100%', boxSizing: 'border-box',
  },
  categoryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px',
    width: '100%', boxSizing: 'border-box',
  },
  categoryCard: {
    background: '#ffffff', borderRadius: '18px', padding: '20px',
    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer',
    fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)', boxSizing: 'border-box',
  },
  categoryCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  categoryPillTag: {
    fontSize: '11px', fontWeight: 700, background: '#f8fafc', padding: '3px 8px', borderRadius: '999px',
    border: '1px solid #e2e8f0',
  },
  catCardTitle: { fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontFamily: 'var(--font-display)' },
  catCardSub: { fontSize: '12.5px', color: '#64748b', lineHeight: 1.45, margin: '0 0 16px', flex: 1 },
  catCardArrow: {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px',
    fontWeight: 700, color: '#059669',
  },
  popularSection: {
    padding: '20px clamp(16px, 4vw, 60px) 60px', maxWidth: '1380px', margin: '0 auto', width: '100%', boxSizing: 'border-box',
  },
  popularGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px',
    width: '100%', boxSizing: 'border-box',
  },
  popularCard: {
    background: '#ffffff', borderRadius: '18px', padding: '20px',
    border: '1px solid #e2e8f0', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)', display: 'flex', flexDirection: 'column',
    boxSizing: 'border-box',
  },
  popCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  popTag: { fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px' },
  popBenefit: { fontSize: '12px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' },
  popName: { fontSize: '15.5px', fontWeight: 700, color: '#0f172a', margin: '6px 0 4px', fontFamily: 'var(--font-display)' },
  popBlurb: { fontSize: '12.5px', color: '#64748b', lineHeight: 1.45, margin: '0 0 16px', flex: 1 },
  popAction: { fontSize: '12.5px', fontWeight: 700, color: '#059669' },
  footer: {
    borderTop: '1px solid #e2e8f0', background: '#ffffff',
    padding: '48px clamp(16px, 4vw, 60px) 28px', marginTop: 'auto',
    width: '100%', boxSizing: 'border-box',
  },
  footerInner: {
    display: 'flex', justifyContent: 'space-between', gap: '36px', flexWrap: 'wrap',
    maxWidth: '1380px', margin: '0 auto 40px', width: '100%', boxSizing: 'border-box',
  },
  footerColBrand: { flex: '1 1 300px', maxWidth: '440px' },
  footerTagline: { fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginTop: '12px' },
  footerColLinks: {
    display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569',
  },
  footerBottom: {
    display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8',
    borderTop: '1px solid #f1f5f9', paddingTop: '22px', maxWidth: '1380px', margin: '0 auto', flexWrap: 'wrap', gap: '12px',
    width: '100%', boxSizing: 'border-box',
  },
}
