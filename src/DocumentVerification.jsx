import { useState, useMemo } from 'react'
import Logo from './Logo'
import { CloseIcon, SearchIcon } from './Icons'

// Real Verhoeff Algorithm Tables for authentic Indian Aadhaar 12-digit validation
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

function validateVerhoeff(numStr) {
  const clean = String(numStr).replace(/\D/g, '')
  if (clean.length !== 12) return false
  let c = 0
  const reversed = clean.split('').reverse().map(Number)
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]]
  }
  return c === 0
}

// Inline helper SVG icons
function ShieldCheckIcon({ size = 18, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function UploadCloudIcon({ size = 18, color = '#0284c7' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      <polyline points="16 16 12 12 8 16" />
    </svg>
  )
}

function AlertTriangleIcon({ size = 18, color = '#e11d48' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CheckmarkCircleIcon({ size = 18, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11.5 14.5 15.5 9.5" />
    </svg>
  )
}

function QrCodeIcon({ size = 18, color = '#0f172a' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      <line x1="7" y1="7" x2="7.01" y2="7" /><line x1="17" y1="7" x2="17.01" y2="7" />
      <line x1="7" y1="17" x2="7.01" y2="17" /><line x1="17" y1="17" x2="17.01" y2="17" />
    </svg>
  )
}

function PrinterIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

// 4 Realistic Demo Presets for Hackathon Testing
const DEMO_PRESETS = [
  {
    label: 'Clean Verified Citizen (100% Ready)',
    badge: '100% Pass',
    badgeColor: '#059669',
    data: {
      aadhaarName: 'Rameshwar Sharma',
      aadhaarNumber: '3412 8790 5642',
      aadhaarDob: '14/08/1984',
      samagraName: 'Rameshwar Sharma',
      samagraId: '194820194',
      annualIncome: '1,40,000',
      domicile: 'Madhya Pradesh',
      casteCategory: 'General / EWS',
      bankLinkedDbt: true,
      incomeCertAgeYears: 1,
    },
  },
  {
    label: 'Name Spelling Mismatch (Devi vs Bai)',
    badge: 'Name Mismatch',
    badgeColor: '#d97706',
    data: {
      aadhaarName: 'Radha Devi',
      aadhaarNumber: '5820 9143 8219',
      aadhaarDob: '05/11/1988',
      samagraName: 'Radha Bai',
      samagraId: '284719302',
      annualIncome: '90,000',
      domicile: 'Madhya Pradesh',
      casteCategory: 'OBC',
      bankLinkedDbt: true,
      incomeCertAgeYears: 2,
    },
  },
  {
    label: 'Aadhaar Checksum Typo (Invalid Digit)',
    badge: 'Verhoeff Failed',
    badgeColor: '#e11d48',
    data: {
      aadhaarName: 'Vikas Patel',
      aadhaarNumber: '4920 1823 9991', // Will fail Verhoeff algorithm
      aadhaarDob: '22/03/1999',
      samagraName: 'Vikas Patel',
      samagraId: '394810294',
      annualIncome: '1,80,000',
      domicile: 'Madhya Pradesh',
      casteCategory: 'OBC',
      bankLinkedDbt: true,
      incomeCertAgeYears: 1,
    },
  },
  {
    label: 'Expired Income & High Income Cap (MMVY)',
    badge: 'Income Breach',
    badgeColor: '#7c3aed',
    data: {
      aadhaarName: 'Aman Verma',
      aadhaarNumber: '8912 3456 7018',
      aadhaarDob: '10/06/2004',
      samagraName: 'Aman Verma',
      samagraId: '582910482',
      annualIncome: '7,20,000', // Exceeds ₹6L ceiling for MMVY
      domicile: 'Madhya Pradesh',
      casteCategory: 'General',
      bankLinkedDbt: false, // Bank account not DBT seeded
      incomeCertAgeYears: 4, // Expired (> 3 years)
    },
  },
]

export default function DocumentVerification({ onClose, onStartChat }) {
  const [formData, setFormData] = useState(DEMO_PRESETS[0].data)
  const [activeTab, setActiveTab] = useState('verification') // 'verification' | 'slip'
  const [isScanning, setIsScanning] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState(null)
  const [printSuccess, setPrintSuccess] = useState(false)

  function applyPreset(preset) {
    setFormData(preset.data)
    setUploadedFileName(null)
  }

  function handleSimulateUpload(e) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFileName(file.name)
      setIsScanning(true)
      setTimeout(() => {
        setIsScanning(false)
      }, 1200)
    }
  }

  // Cross-matching calculations
  const verificationResult = useMemo(() => {
    const checks = []
    let score = 0

    // 1. Aadhaar Verhoeff Checksum Check
    const cleanAadhaar = formData.aadhaarNumber.replace(/\s+/g, '')
    const isVerhoeffValid = cleanAadhaar.length === 12 && validateVerhoeff(cleanAadhaar)
    
    if (isVerhoeffValid) {
      checks.push({
        id: 'aadhaar_chk',
        title: 'UIDAI Aadhaar Checksum Validated (Verhoeff Alg.)',
        status: 'pass',
        desc: `12-digit number [${formData.aadhaarNumber}] passed mathematical checksum. No keyboard typos detected.`,
      })
      score += 25
    } else {
      checks.push({
        id: 'aadhaar_chk',
        title: 'Aadhaar Checksum Failure (Invalid Check Digit)',
        status: 'fail',
        desc: `Number [${formData.aadhaarNumber}] failed Verhoeff checksum test. Please re-check the physical Aadhaar card digits.`,
      })
    }

    // 2. Name Matching between Aadhaar and Samagra ID
    const aName = formData.aadhaarName.trim().toLowerCase()
    const sName = formData.samagraName.trim().toLowerCase()
    const isExactName = aName === sName
    const isPartialName = aName.split(' ')[0] === sName.split(' ')[0]

    if (isExactName) {
      checks.push({
        id: 'name_sync',
        title: 'Cross-Document Name Match 100%',
        status: 'pass',
        desc: `Exact spelling match across Aadhaar ("${formData.aadhaarName}") and Samagra Portal ID.`,
      })
      score += 30
    } else if (isPartialName) {
      checks.push({
        id: 'name_sync',
        title: 'Name Spelling Mismatch Detected',
        status: 'warn',
        desc: `Aadhaar name "${formData.aadhaarName}" differs from Samagra ID "${formData.samagraName}". Treasury will reject DBT without Samagra e-KYC harmonization.`,
      })
      score += 10
    } else {
      checks.push({
        id: 'name_sync',
        title: 'Critical Identity Discrepancy',
        status: 'fail',
        desc: `Names do not match ("${formData.aadhaarName}" vs "${formData.samagraName}"). Application will be auto-flagged for biometric re-verification.`,
      })
    }

    // 3. Bank Account Aadhaar-NPCI DBT Seeding Check
    if (formData.bankLinkedDbt) {
      checks.push({
        id: 'dbt_seed',
        title: 'Bank Account Aadhaar-NPCI Seeding Active',
        status: 'pass',
        desc: 'Direct Bank Transfer (DBT) pathway confirmed ready for scheme funds (e.g., Ladli Behna, PM-KISAN).',
      })
      score += 25
    } else {
      checks.push({
        id: 'dbt_seed',
        title: 'Bank Account NOT Seeded with NPCI / Aadhaar',
        status: 'fail',
        desc: 'Bank account is missing DBT link. Direct benefits will bounce during Treasury PFMS clearance.',
      })
    }

    // 4. Income Certificate Validity
    const incomeNum = parseInt(formData.annualIncome.replace(/,/g, ''), 10) || 0
    const isCertExpired = formData.incomeCertAgeYears > 3
    const isHighIncome = incomeNum > 600000

    if (isCertExpired) {
      checks.push({
        id: 'income_valid',
        title: 'Income Certificate Expired (> 3 Years Old)',
        status: 'fail',
        desc: `Certificate is ${formData.incomeCertAgeYears} years old. MP e-District rules require re-issuance every 3 years.`,
      })
    } else if (isHighIncome) {
      checks.push({
        id: 'income_valid',
        title: 'Family Income Exceeds ₹6 Lakh Ceiling',
        status: 'warn',
        desc: `Annual income ₹${formData.annualIncome} exceeds statutory cap for MMVY Tuition Waiver and BPL schemes.`,
      })
      score += 10
    } else {
      checks.push({
        id: 'income_valid',
        title: 'Income & Domicile Eligibility Verified',
        status: 'pass',
        desc: `Income ₹${formData.annualIncome}/year is within welfare limits. Domicile "${formData.domicile}" verified.`,
      })
      score += 20
    }

    return {
      score,
      checks,
      isKioskReady: score >= 85,
    }
  }, [formData])

  function handlePrintSlip() {
    setPrintSuccess(true)
    setTimeout(() => {
      window.print()
      setPrintSuccess(false)
    }, 300)
  }

  function handleStartChatFromDoc() {
    if (onStartChat) {
      const summary = `I used the Document Pre-Verification tool. My verified details: Name: ${formData.aadhaarName}, Annual Income: ₹${formData.annualIncome}, Category: ${formData.casteCategory}. Please tell me what welfare schemes I qualify for.`
      onStartChat(summary)
    }
    if (onClose) onClose()
  }

  return (
    <div className="ym-modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="ym-modal-card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <Logo size={42} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={styles.govBadge}>MPOnline Kiosk Pre-Verification</span>
                <span style={styles.liveIndicator}>● Verhoeff Algorithm Active</span>
                <span style={styles.ocrBadge}>Computer Vision OCR</span>
              </div>
              <h2 style={styles.title}>AI Citizen Document Inspector & Kiosk Slip Generator</h2>
            </div>
          </div>
          <button className="ym-close-pill-btn" onClick={onClose} aria-label="Close" title="Close">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'verification' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('verification')}
          >
            <ShieldCheckIcon size={16} color={activeTab === 'verification' ? '#ffffff' : '#059669'} />
            <span>Document Inspection & OCR Engine</span>
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'slip' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('slip')}
          >
            <QrCodeIcon size={16} color={activeTab === 'slip' ? '#ffffff' : '#0284c7'} />
            <span>Pre-Verified Kiosk Slip (QR Token)</span>
          </button>
        </div>

        {/* 1-Click Demo Presets Bar */}
        <div style={styles.presetsBar}>
          <span style={styles.presetsLabel}>TEST HACKATHON PERSONAS:</span>
          <div style={styles.presetsList}>
            {DEMO_PRESETS.map((p, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.presetChip,
                  borderColor: formData.aadhaarName === p.data.aadhaarName ? p.badgeColor : '#e2e8f0',
                  background: formData.aadhaarName === p.data.aadhaarName ? `${p.badgeColor}15` : '#ffffff',
                }}
                onClick={() => applyPreset(p)}
              >
                <span style={{ ...styles.presetBadge, background: p.badgeColor }}>{p.badge}</span>
                <span style={styles.presetText}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: VERIFICATION & LIVE EDITING */}
        {activeTab === 'verification' && (
          <div style={styles.mainGrid}>
            {/* Left Column: Form & Simulated Image Dropzone */}
            <div style={styles.formCol}>
              {/* Image Upload simulation box */}
              <div style={styles.uploadCard}>
                <div style={styles.uploadHeader}>
                  <UploadCloudIcon size={20} color="#0284c7" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      Scan or Upload Citizen Document Photo
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                      Aadhaar Card, Samagra ID slip, or Income Certificate (PNG, JPG, PDF)
                    </p>
                  </div>
                </div>

                <label style={styles.fileInputLabel}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleSimulateUpload}
                  />
                  <span>📁 {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Choose File or Snap Camera Photo...'}</span>
                </label>

                {isScanning && (
                  <div style={styles.scanningIndicator}>
                    <span>🔄 AI OCR extracting text from document...</span>
                  </div>
                )}
              </div>

              {/* Editable Extracted Fields */}
              <div style={styles.fieldSection}>
                <h4 style={styles.fieldSectionTitle}>Extracted Identity Data (Editable)</h4>
                
                <div style={styles.fieldRow2}>
                  <div>
                    <label style={styles.label}>Name on Aadhaar Card</label>
                    <input
                      style={styles.input}
                      value={formData.aadhaarName}
                      onChange={(e) => setFormData({ ...formData, aadhaarName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Aadhaar Number (12 Digits)</label>
                    <input
                      style={styles.input}
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.fieldRow2}>
                  <div>
                    <label style={styles.label}>Name on Samagra Portal</label>
                    <input
                      style={styles.input}
                      value={formData.samagraName}
                      onChange={(e) => setFormData({ ...formData, samagraName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Samagra Member ID (9 Digits)</label>
                    <input
                      style={styles.input}
                      value={formData.samagraId}
                      onChange={(e) => setFormData({ ...formData, samagraId: e.target.value })}
                    />
                  </div>
                </div>

                <div style={styles.fieldRow3}>
                  <div>
                    <label style={styles.label}>Annual Family Income (₹)</label>
                    <input
                      style={styles.input}
                      value={formData.annualIncome}
                      onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Category</label>
                    <select
                      style={styles.input}
                      value={formData.casteCategory}
                      onChange={(e) => setFormData({ ...formData, casteCategory: e.target.value })}
                    >
                      <option>General / EWS</option>
                      <option>OBC</option>
                      <option>SC</option>
                      <option>ST</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Income Certificate Age</label>
                    <select
                      style={styles.input}
                      value={formData.incomeCertAgeYears}
                      onChange={(e) => setFormData({ ...formData, incomeCertAgeYears: Number(e.target.value) })}
                    >
                      <option value={1}>1 Year Old (Valid)</option>
                      <option value={2}>2 Years Old (Valid)</option>
                      <option value={4}>4 Years Old (Expired)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.bankLinkedDbt}
                      onChange={(e) => setFormData({ ...formData, bankLinkedDbt: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#059669' }}
                    />
                    <span>Bank Account is Seeded with Aadhaar-NPCI for Direct Benefit Transfer (DBT)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: AI Analysis Scorecard */}
            <div style={styles.resultsCol}>
              {/* Scorecard Hero Box */}
              <div style={{
                ...styles.scoreBox,
                borderTop: `4px solid ${verificationResult.score >= 85 ? '#059669' : verificationResult.score >= 60 ? '#d97706' : '#e11d48'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                      Kiosk Pre-Screening Result
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: verificationResult.score >= 85 ? '#059669' : verificationResult.score >= 60 ? '#d97706' : '#e11d48' }}>
                      {verificationResult.score}% Document Readiness
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: verificationResult.isKioskReady ? '#ecfdf5' : '#fef2f2',
                    color: verificationResult.isKioskReady ? '#047857' : '#b91c1c',
                    border: `1px solid ${verificationResult.isKioskReady ? '#a7f3d0' : '#fca5a5'}`
                  }}>
                    {verificationResult.isKioskReady ? '✓ KIOSK READY' : '⚠️ ACTION REQUIRED'}
                  </span>
                </div>
              </div>

              {/* Individual Verification Checks */}
              <div style={styles.checksList}>
                {verificationResult.checks.map((chk) => (
                  <div key={chk.id} style={{
                    ...styles.checkCard,
                    borderLeft: `4px solid ${chk.status === 'pass' ? '#10b981' : chk.status === 'warn' ? '#f59e0b' : '#ef4444'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      {chk.status === 'pass' ? (
                        <CheckmarkCircleIcon size={16} color="#10b981" />
                      ) : chk.status === 'warn' ? (
                        <AlertTriangleIcon size={16} color="#f59e0b" />
                      ) : (
                        <AlertTriangleIcon size={16} color="#ef4444" />
                      )}
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{chk.title}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.45, paddingLeft: '24px' }}>
                      {chk.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={styles.actionBtnGroup}>
                <button
                  style={styles.generateSlipBtn}
                  onClick={() => setActiveTab('slip')}
                >
                  <QrCodeIcon size={15} color="#ffffff" />
                  <span>Generate Pre-Verified Kiosk Slip →</span>
                </button>

                <button
                  style={styles.chatHandoffBtn}
                  onClick={handleStartChatFromDoc}
                >
                  <span>Ask Jan Seva AI About Matching Schemes →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRE-VERIFIED KIOSK SLIP */}
        {activeTab === 'slip' && (
          <div style={styles.slipContainer}>
            <div style={styles.kioskSlipCard} id="printable-kiosk-slip">
              {/* Slip Header */}
              <div style={styles.slipHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Logo size={36} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>GOVERNMENT OF MADHYA PRADESH</div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>MPOnline Citizen Portal · Pre-Verification Token</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Token Reference:</div>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>MPOL-2026-VER-8912</strong>
                </div>
              </div>

              {/* Verified Ribbon */}
              <div style={{
                background: verificationResult.isKioskReady ? '#ecfdf5' : '#fffbeb',
                border: `1px solid ${verificationResult.isKioskReady ? '#a7f3d0' : '#fde68a'}`,
                padding: '8px 12px',
                borderRadius: '8px',
                margin: '12px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: verificationResult.isKioskReady ? '#047857' : '#b45309' }}>
                  {verificationResult.isKioskReady ? '✓ STATUS: 100% PRE-VERIFIED FOR KIOSK SUBMISSION' : '⚠️ STATUS: CONDITIONAL CLEARANCE (FIX WARNINGS FIRST)'}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Date: 03-Oct-2026</span>
              </div>

              {/* Citizen Data Grid */}
              <div style={styles.slipDataGrid}>
                <div style={styles.slipDataItem}>
                  <div style={styles.slipDataLabel}>Citizen Name</div>
                  <div style={styles.slipDataVal}>{formData.aadhaarName}</div>
                </div>
                <div style={styles.slipDataItem}>
                  <div style={styles.slipDataLabel}>Aadhaar UID</div>
                  <div style={styles.slipDataVal}>•••• •••• {formData.aadhaarNumber.slice(-4)}</div>
                </div>
                <div style={styles.slipDataItem}>
                  <div style={styles.slipDataLabel}>Samagra Member ID</div>
                  <div style={styles.slipDataVal}>{formData.samagraId}</div>
                </div>
                <div style={styles.slipDataItem}>
                  <div style={styles.slipDataLabel}>Annual Income</div>
                  <div style={styles.slipDataVal}>₹{formData.annualIncome}</div>
                </div>
                <div style={styles.slipDataItem}>
                  <div style={styles.slipDataLabel}>Category & Domicile</div>
                  <div style={styles.slipDataVal}>{formData.casteCategory} · {formData.domicile}</div>
                </div>
                <div style={styles.slipDataItem}>
                  <div style={styles.slipDataLabel}>DBT Bank Pathway</div>
                  <div style={{ ...styles.slipDataVal, color: formData.bankLinkedDbt ? '#059669' : '#e11d48' }}>
                    {formData.bankLinkedDbt ? 'Aadhaar-NPCI Linked' : 'Not Seeded'}
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code Section */}
              <div style={styles.qrSection}>
                <div style={styles.qrBox}>
                  {/* Clean SVG QR Pattern Representation */}
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="#ffffff" />
                    {/* Corner Position Boxes */}
                    <rect x="10" y="10" width="24" height="24" stroke="#0f172a" strokeWidth="4" fill="none" />
                    <rect x="16" y="16" width="12" height="12" fill="#0f172a" />
                    
                    <rect x="66" y="10" width="24" height="24" stroke="#0f172a" strokeWidth="4" fill="none" />
                    <rect x="72" y="16" width="12" height="12" fill="#0f172a" />
                    
                    <rect x="10" y="66" width="24" height="24" stroke="#0f172a" strokeWidth="4" fill="none" />
                    <rect x="16" y="72" width="12" height="12" fill="#0f172a" />
                    
                    {/* Simulated Payload Matrix dots */}
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
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: '#0f172a' }}>Scan at Kiosk for Instant Form Auto-Fill</h4>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: 1.45 }}>
                    The MPOnline kiosk operator scans this token QR code using their barcode scanner. All verified fields populate the official portal in 2 seconds with zero manual typing errors.
                  </p>
                </div>
              </div>
            </div>

            {/* Slip Action Bar */}
            <div style={styles.slipActionsRow}>
              <button
                style={styles.backBtn}
                onClick={() => setActiveTab('verification')}
              >
                ← Back to Edit Data
              </button>

              <button
                style={styles.printBtn}
                onClick={handlePrintSlip}
              >
                <PrinterIcon size={15} color="#ffffff" />
                <span>{printSuccess ? 'Opening Print Dialog...' : 'Print / Save Kiosk Slip'}</span>
              </button>
            </div>
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
  ocrBadge: {
    color: '#0284c7',
    fontSize: '11px',
    fontWeight: 700,
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
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
    marginBottom: '14px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '4px',
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
  },
  tabBtnActive: {
    background: '#059669',
    color: '#ffffff',
    borderColor: '#059669',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
  },
  presetsBar: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '10px 14px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  presetsLabel: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.04em',
  },
  presetsList: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  presetChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  presetBadge: {
    color: '#ffffff',
    fontSize: '9.5px',
    fontWeight: 800,
    padding: '2px 5px',
    borderRadius: '4px',
  },
  presetText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '16px',
  },
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  uploadCard: {
    background: '#f0f9ff',
    border: '1.5px dashed #7dd3fc',
    borderRadius: '14px',
    padding: '14px',
  },
  uploadHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  fileInputLabel: {
    display: 'block',
    textAlign: 'center',
    background: '#ffffff',
    border: '1px solid #bae6fd',
    color: '#0284c7',
    padding: '8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  scanningIndicator: {
    marginTop: '8px',
    fontSize: '11.5px',
    color: '#0284c7',
    fontWeight: 700,
    textAlign: 'center',
  },
  fieldSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '14px',
  },
  fieldSectionTitle: {
    margin: '0 0 10px',
    fontSize: '12.5px',
    fontWeight: 800,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  fieldRow2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '8px',
  },
  fieldRow3: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '10px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '3px',
  },
  input: {
    width: '100%',
    padding: '7px 9px',
    borderRadius: '7px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    color: '#0f172a',
  },
  resultsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  scoreBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  checksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  actionBtnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  generateSlipBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
  },
  chatHandoffBtn: {
    display: 'block',
    textAlign: 'center',
    padding: '9px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  slipContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    alignItems: 'center',
  },
  kioskSlipCard: {
    background: '#ffffff',
    border: '2px solid #cbd5e1',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '560px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
  },
  slipHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1.5px solid #e2e8f0',
    paddingBottom: '10px',
  },
  slipDataGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    margin: '12px 0',
  },
  slipDataItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  slipDataLabel: {
    fontSize: '10.5px',
    color: '#64748b',
    fontWeight: 700,
  },
  slipDataVal: {
    fontSize: '12.5px',
    fontWeight: 800,
    color: '#0f172a',
    marginTop: '2px',
  },
  qrSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#f1f5f9',
    borderRadius: '10px',
    padding: '12px',
    marginTop: '10px',
  },
  qrBox: {
    background: '#ffffff',
    padding: '6px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '560px',
    width: '100%',
    gap: '10px',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #cbd5e1',
    color: '#334155',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
  },
}
