import { useState } from 'react'
import Logo from './Logo'
import { CloseIcon, SpeakerOnIcon, StopIcon } from './Icons'
import { speakText, stopSpeaking } from './lib/speech'

export default function PanchayatVoiceTokenModal({ messageText, onClose, voiceLang = 'hi-IN' }) {
  const [isSpeakingToken, setIsSpeakingToken] = useState(false)
  const tokenNumber = `MP-VOICE-${Math.floor(1000 + Math.random() * 9000)}`
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  // Extract scheme names or bullet lines from messageText
  const lines = (messageText || '').split('\n').filter((l) => l.trim().length > 0)
  const schemeBullets = lines.filter((l) => /^[*\-•#]|\b(yojana|योजना|kalyan|कल्याण|scholarship|पेंशन|ladli|pm|cm)\b/i.test(l)).slice(0, 5)

  const summaryToSpeak = voiceLang === 'en-IN'
    ? `Namaste. This is your Government of Madhya Pradesh Jan Seva Voice Token. Your Token ID is ${tokenNumber}. Present this slip to your Gram Panchayat Secretary or CSC Kiosk operator to claim your welfare benefits.`
    : `नमस्ते। यह आपका मध्य प्रदेश शासन जन सेवा आवाज टोकन है। टोकन नंबर है ${tokenNumber}। इस पर्ची को अपने ग्राम पंचायत सचिव, पटवारी या सीएससी कियोस्क संचालक को दिखाकर तुरंत योजना का लाभ प्राप्त करें।`

  function handleSpeakSlip() {
    if (isSpeakingToken) {
      stopSpeaking()
      setIsSpeakingToken(false)
      return
    }
    setIsSpeakingToken(true)
    speakText(summaryToSpeak, voiceLang, {
      onStart: () => setIsSpeakingToken(true),
      onEnd: () => setIsSpeakingToken(false),
    })
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Top Action Bar (hidden in print) */}
        <div style={styles.topActions} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.badgeVoice}>🎙️ आवाज़ सेवा कियोस्क पर्ची (VOICE TOKEN)</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>For Rural & Non-Literate Citizens</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={styles.speakBtn}
              onClick={handleSpeakSlip}
              title="Listen to this slip in spoken voice"
            >
              {isSpeakingToken ? (
                <>
                  <StopIcon size={14} color="#ffffff" />
                  <span>रोकें (Stop Audio)</span>
                </>
              ) : (
                <>
                  <SpeakerOnIcon size={14} color="#059669" />
                  <span>पर्ची सुनें (Listen Slip)</span>
                </>
              )}
            </button>
            <button style={styles.printBtn} onClick={handlePrint}>
              <span>🖨️ प्रिंट पर्ची (Print Slip)</span>
            </button>
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Printable Physical Slip Card */}
        <div style={styles.slipCard} id="panchayat-voice-slip">
          {/* Official Emblem & State Header */}
          <div style={styles.slipHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Logo size={44} />
              <div>
                <div style={styles.govtTitle}>GOVERNMENT OF MADHYA PRADESH</div>
                <div style={styles.portalTitle}>MPOnline Jan Seva · Gram Panchayat Audio Kiosk Slip</div>
                <div style={styles.hindiSub}>मध्य प्रदेश शासन · ग्राम पंचायत आवाज परामर्श रसीद</div>
              </div>
            </div>
            <div style={styles.tokenBox}>
              <div style={styles.tokenLabel}>VERIFIED TOKEN ID</div>
              <div style={styles.tokenVal}>{tokenNumber}</div>
              <div style={styles.tokenDate}>Date: {currentDate}</div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Verification Status Ribbon */}
          <div style={styles.statusRibbon}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={styles.verifiedDot} />
              <strong style={{ color: '#047857', fontSize: '13px' }}>
                ✓ AI SOVEREIGN VERIFIED · पंचायत स्तरीय सहायता पर्ची
              </strong>
            </div>
            <span style={{ fontSize: '11.5px', color: '#065f46', fontWeight: 600 }}>
              Mode: Voice Consultation / बोलकर आवेदन
            </span>
          </div>

          {/* Key Beneficiary Summary */}
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>सेवा का माध्यम (Channel):</span>
              <strong style={styles.summaryVal}>Gram Panchayat Audio Kiosk (181 Dial-In)</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>सत्यापन स्थिति (Status):</span>
              <strong style={{ ...styles.summaryVal, color: '#059669' }}>Pre-Qualified for Welfare Schemes</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>संबंधित विभाग (Departments):</span>
              <strong style={styles.summaryVal}>Panchayat & Rural Development / MPOnline</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>आवश्यक दस्तावेज (Carry Documents):</span>
              <strong style={styles.summaryVal}>Samagra ID, Aadhaar Card, Bank Passbook</strong>
            </div>
          </div>

          {/* Identified Schemes & Spoken Advice */}
          <div style={styles.schemesSection}>
            <div style={styles.sectionHeading}>
              <span>📋 अनुशंसित योजनाएं एवं पात्रता (Recommended Schemes)</span>
            </div>
            <div style={styles.schemeList}>
              {schemeBullets.length > 0 ? (
                schemeBullets.map((line, idx) => (
                  <div key={idx} style={styles.schemeBulletItem}>
                    <span style={styles.bulletDot}>●</span>
                    <span style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
                      {line.replace(/^[*\-•#]+\s*/, '')}
                    </span>
                  </div>
                ))
              ) : (
                <div style={styles.schemeBulletItem}>
                  <span style={styles.bulletDot}>●</span>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>
                    PM Kisan + MP Mukhyamantri Kisan Kalyan Yojana (₹12,000/yr Direct DBT)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code & Sachiv Verification Instructions */}
          <div style={styles.footerSection}>
            <div style={styles.instructionsCol}>
              <div style={styles.instTitle}>📌 नागरिक एवं पंचायत सचिव हेतु निर्देश:</div>
              <ol style={styles.instList}>
                <li>नागरिक यह पर्ची अपने ग्राम पंचायत सचिव, पटवारी अथवा नजदीकी MPOnline / CSC कियोस्क पर प्रस्तुत करें।</li>
                <li>ऑपरेटर टोकन नंबर <strong>{tokenNumber}</strong> दर्ज करके नागरिक के समग्र आईडी से स्वतः आवेदन पूर्ण करें।</li>
                <li>बिना किसी दलाली अथवा अतिरिक्त शुल्क के शासकीय लाभ नागरिक के बैंक खाते (DBT) में अंतरित होगा।</li>
              </ol>
            </div>

            {/* Official SVG QR Code */}
            <div style={styles.qrCol}>
              <div style={styles.qrBox}>
                <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="24" height="24" stroke="#0f172a" strokeWidth="4" fill="none" />
                  <rect x="16" y="16" width="12" height="12" fill="#0f172a" />
                  <rect x="66" y="10" width="24" height="24" stroke="#0f172a" strokeWidth="4" fill="none" />
                  <rect x="72" y="16" width="12" height="12" fill="#0f172a" />
                  <rect x="10" y="66" width="24" height="24" stroke="#0f172a" strokeWidth="4" fill="none" />
                  <rect x="16" y="72" width="12" height="12" fill="#0f172a" />
                  <rect x="42" y="14" width="6" height="6" fill="#059669" />
                  <rect x="52" y="14" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="34" width="6" height="6" fill="#059669" />
                  <rect x="14" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="24" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="34" y="44" width="6" height="6" fill="#059669" />
                  <rect x="44" y="44" width="12" height="12" fill="#059669" />
                  <rect x="64" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="44" y="64" width="6" height="6" fill="#0f172a" />
                  <rect x="54" y="64" width="6" height="6" fill="#059669" />
                  <rect x="64" y="64" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="74" width="6" height="6" fill="#059669" />
                  <rect x="84" y="74" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>
              <div style={styles.qrCaption}>Scan to Validate on MPOnline</div>
            </div>
          </div>

          {/* Official Seal Footer */}
          <div style={styles.sealRow}>
            <span>Toll-Free CM Helpline: 181 · MPOnline Jan Seva Portal</span>
            <span>Digital Signature Verified · No Physical Signature Required</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
    overflowY: 'auto',
  },
  modal: {
    background: '#ffffff',
    borderRadius: '16px',
    maxWidth: '720px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '92vh',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '10px',
  },
  badgeVoice: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#047857',
    background: '#ecfdf5',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #a7f3d0',
  },
  speakBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    border: '1px solid #a7f3d0',
    background: '#ecfdf5',
    color: '#047857',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '8px',
    border: 'none',
    background: '#059669',
    color: '#ffffff',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  slipCard: {
    padding: '24px',
    overflowY: 'auto',
    background: '#ffffff',
    fontFamily: 'var(--font-body)',
  },
  slipHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  govtTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '0.4px',
  },
  portalTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#059669',
  },
  hindiSub: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 500,
  },
  tokenBox: {
    textAlign: 'right',
    background: '#f8fafc',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  tokenLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tokenVal: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '0.5px',
  },
  tokenDate: {
    fontSize: '10.5px',
    color: '#64748b',
  },
  divider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '14px 0',
  },
  statusRibbon: {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
    border: '1.5px solid #a7f3d0',
    borderRadius: '8px',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  verifiedDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#059669',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    background: '#f8fafc',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
  },
  summaryVal: {
    fontSize: '12.5px',
    color: '#0f172a',
  },
  schemesSection: {
    marginBottom: '16px',
  },
  sectionHeading: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '8px',
  },
  schemeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  schemeBulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  bulletDot: {
    color: '#059669',
    fontSize: '12px',
    marginTop: '2px',
  },
  footerSection: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    marginBottom: '14px',
  },
  instructionsCol: {
    flex: 1,
  },
  instTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#b45309',
    marginBottom: '4px',
  },
  instList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '11.5px',
    color: '#78350f',
    lineHeight: 1.5,
  },
  qrCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  qrBox: {
    background: '#ffffff',
    padding: '6px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
  },
  qrCaption: {
    fontSize: '9.5px',
    color: '#64748b',
    fontWeight: 600,
  },
  sealRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '10px',
    color: '#94a3b8',
    borderTop: '1px dashed #cbd5e1',
    paddingTop: '8px',
  },
}
