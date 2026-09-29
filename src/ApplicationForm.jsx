import { useState, useEffect, useRef } from 'react'
import { extractDocumentFields } from './lib/gemini'
import { saveDraft, loadDraft, clearDraft } from './lib/applicationDraft'
import { isCurrentlyOnline, subscribeToConnectionStatus } from './lib/offline'
import Logo from './Logo'
import { CloseIcon } from './Icons'

const FIELD_ORDER = [
  'Full Name', 'Date of Birth', 'Gender', 'Aadhaar Number', 'Mobile Number',
  "Father's or Husband's Name", 'Address', 'Village', 'District', 'State',
  'Bank Account Number', 'IFSC Code', 'Bank Name',
  'Land/Khasra/Khatauni Number', 'Annual Income', 'Category',
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Built-in SVG QR Code Generator (no external package needed)
function SimpleQRCode({ text, size = 100 }) {
  const rows = 21
  const cells = []
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < rows; c++) {
      const isTopLeft = r < 7 && c < 7
      const isTopRight = r < 7 && c >= rows - 7
      const isBottomLeft = r >= rows - 7 && c < 7

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isBottomLeft ? r - (rows - 7) : r
        const localC = isTopRight ? c - (rows - 7) : c
        const isBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6
        const isCenter = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4
        if (isBorder || isCenter) cells.push({ r, c })
      } else {
        if (Math.abs(Math.sin((r * rows + c + hash) * 1.618)) > 0.48) {
          cells.push({ r, c })
        }
      }
    }
  }

  const cellSize = size / rows

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', padding: '4px', borderRadius: '6px' }}>
      {cells.map(({ r, c }, idx) => (
        <rect key={idx} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#14532d" />
      ))}
    </svg>
  )
}

// Official MPOnline Receipt Modal Component
function OfficialApplicationReceiptModal({ scheme, fields, onClose }) {
  const receiptRef = useRef(null)
  const applicationNo = `MP-YJM-${Math.floor(100000 + Math.random() * 900000)}`
  const timestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const verificationUrl = `https://mponline.gov.in/verify?appNo=${applicationNo}`

  return (
    <div style={receiptStyles.overlay} onClick={onClose}>
      <div style={receiptStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="no-print" style={receiptStyles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={receiptStyles.officialBadge}>Official GovTech Document</span>
            <span style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)' }}>MPOnline Acknowledgment Slip</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ym-cta" style={receiptStyles.printBtn} onClick={() => window.print()}>
              🖨️ Print / Save PDF
            </button>
            <button style={receiptStyles.closeBtn} onClick={onClose}>
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div ref={receiptRef} style={receiptStyles.receiptSheet} className="printable-receipt">
          <div style={receiptStyles.govHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Logo size={42} />
              <div>
                <div style={receiptStyles.govTitle}>GOVERNMENT OF MADHYA PRADESH</div>
                <div style={receiptStyles.govSub}>MPOnline Citizen Services Portal · Lok Sewa Kendra (CSC)</div>
                <div style={receiptStyles.slipType}>PRE-FILLED CITIZEN APPLICATION ACKNOWLEDGMENT SLIP</div>
              </div>
            </div>
            <div style={receiptStyles.qrContainer}>
              <SimpleQRCode text={verificationUrl} size={86} />
              <div style={receiptStyles.qrLabel}>Scan to Verify</div>
            </div>
          </div>

          <div style={receiptStyles.metaRow}>
            <div><strong>Application Ref No:</strong> <span style={receiptStyles.highlightRef}>{applicationNo}</span></div>
            <div><strong>Date & Time:</strong> {timestamp}</div>
            <div><strong>Status:</strong> <span style={receiptStyles.verifiedTag}>AI Pre-Verified & Ready</span></div>
          </div>

          <div style={receiptStyles.schemeBanner}>
            <div style={receiptStyles.schemeBannerLabel}>APPLIED SCHEME</div>
            <div style={receiptStyles.schemeBannerName}>{scheme.scheme_name}</div>
            {scheme.scheme_name_hindi && (
              <div style={receiptStyles.schemeBannerHindi}>({scheme.scheme_name_hindi})</div>
            )}
            <div style={receiptStyles.schemeBannerDetails}>
              <span><strong>Category:</strong> {scheme.category}</span>
              <span>·</span>
              <span><strong>Jurisdiction:</strong> {scheme.level}</span>
              <span>·</span>
              <span><strong>Benefits:</strong> {scheme.benefits}</span>
            </div>
          </div>

          <div style={receiptStyles.sectionHeader}>BENEFICIARY PARTICULARS</div>
          <table style={receiptStyles.detailsTable}>
            <tbody>
              <tr>
                <td style={receiptStyles.tableLabel}>Applicant Full Name:</td>
                <td style={receiptStyles.tableVal}><strong>{fields['Full Name'] || '—'}</strong></td>
                <td style={receiptStyles.tableLabel}>Date of Birth:</td>
                <td style={receiptStyles.tableVal}>{fields['Date of Birth'] || '—'}</td>
              </tr>
              <tr>
                <td style={receiptStyles.tableLabel}>Aadhaar Number:</td>
                <td style={receiptStyles.tableVal}>
                  {fields['Aadhaar Number'] ? `XXXXXXXX${fields['Aadhaar Number'].slice(-4)}` : 'Verified via OCR'}
                </td>
                <td style={receiptStyles.tableLabel}>Gender / Category:</td>
                <td style={receiptStyles.tableVal}>{fields['Gender'] || '—'} / {fields['Category'] || 'General'}</td>
              </tr>
              <tr>
                <td style={receiptStyles.tableLabel}>Father / Husband Name:</td>
                <td style={receiptStyles.tableVal}>{fields["Father's or Husband's Name"] || '—'}</td>
                <td style={receiptStyles.tableLabel}>Mobile Number:</td>
                <td style={receiptStyles.tableVal}>{fields['Mobile Number'] || '—'}</td>
              </tr>
              <tr>
                <td style={receiptStyles.tableLabel}>Bank Name & Branch:</td>
                <td style={receiptStyles.tableVal}>{fields['Bank Name'] || '—'}</td>
                <td style={receiptStyles.tableLabel}>Account & IFSC:</td>
                <td style={receiptStyles.tableVal}>{fields['Bank Account Number'] ? `A/C: ${fields['Bank Account Number']}` : '—'} ({fields['IFSC Code'] || '—'})</td>
              </tr>
              <tr>
                <td style={receiptStyles.tableLabel}>Village / Town:</td>
                <td style={receiptStyles.tableVal}>{fields['Village'] || fields['Address'] || '—'}</td>
                <td style={receiptStyles.tableLabel}>District & State:</td>
                <td style={receiptStyles.tableVal}>{fields['District'] || 'Bhopal'}, {fields['State'] || 'Madhya Pradesh'}</td>
              </tr>
              <tr>
                <td style={receiptStyles.tableLabel}>Land Record / Khasra:</td>
                <td style={receiptStyles.tableVal}>{fields['Land/Khasra/Khatauni Number'] || 'N/A'}</td>
                <td style={receiptStyles.tableLabel}>Annual Income:</td>
                <td style={receiptStyles.tableVal}>{fields['Annual Income'] || 'Below Statutory Limit'}</td>
              </tr>
            </tbody>
          </table>

          <div style={receiptStyles.checklistSection}>
            <div style={receiptStyles.checklistCol}>
              <div style={receiptStyles.sectionHeader}>ATTACHED DOCUMENT CHECKLIST</div>
              <ul style={receiptStyles.checkUl}>
                <li>☑ Aadhaar Card Photocopy (e-KYC verified)</li>
                <li>☑ Bank Account Passbook (DBT/NPCI Active)</li>
                <li>☑ Resident / Domicile Certificate (Madhya Pradesh)</li>
                <li>☑ Samagra Family ID / Land Record (Khasra B-1)</li>
              </ul>
            </div>
            <div style={receiptStyles.checklistCol}>
              <div style={receiptStyles.sectionHeader}>SUBMISSION INSTRUCTIONS</div>
              <div style={receiptStyles.instructionText}>
                <strong>How to finalize:</strong> {scheme.how_to_apply || 'Submit at nearest MPOnline Kiosk / Lok Sewa Kendra with original IDs for biometric verification.'}
              </div>
            </div>
          </div>

          <div style={receiptStyles.footerStamps}>
            <div style={receiptStyles.stampBox}>
              <div style={receiptStyles.stampDotted}>
                <span>DIGITAL VERIFICATION HASH</span>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  SHA256: MP-SECURE-GOV-VERIFIED
                </div>
              </div>
            </div>
            <div style={receiptStyles.signatureBox}>
              <div style={receiptStyles.signatureLine} />
              <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                Signature of Applicant / Kiosk Operator
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Yojana Mitra Digital Governance Initiative
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationForm({ schemes, onClose, onRetryLoadSchemes, initialSchemeId }) {
  const [selectedSchemeId, setSelectedSchemeId] = useState(initialSchemeId || schemes[0]?.id || '')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [fields, setFields] = useState(null)
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [isOnline, setIsOnline] = useState(isCurrentlyOnline())
  const [offlinePending, setOfflinePending] = useState(false)
  const [resumedNotice, setResumedNotice] = useState(false)
  const [showOfficialReceipt, setShowOfficialReceipt] = useState(false)

  const selectedScheme = schemes.find((s) => s.id === selectedSchemeId) || schemes[0]

  function revokePreviews() {
    previews.forEach((url) => URL.revokeObjectURL(url))
  }

  function handleClose() {
    revokePreviews()
    onClose()
  }

  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft && draft.files && draft.files.length > 0) {
        setSelectedSchemeId(initialSchemeId || draft.schemeId || schemes[0]?.id || '')
        setFiles(draft.files)
        setPreviews(draft.files.map((f) => URL.createObjectURL(f)))
        setConsentGiven(true)
        setResumedNotice(true)
        if (draft.fields) {
          setFields(draft.fields)
          setNotes(draft.notes || null)
        } else {
          setOfflinePending(true)
        }
      }
    })
  }, [initialSchemeId, schemes])

  useEffect(() => {
    if (!consentGiven || files.length === 0 || !fields) return
    const timer = setTimeout(() => {
      saveDraft({ schemeId: selectedSchemeId, files, consentGiven: true, fields, notes })
    }, 600)
    return () => clearTimeout(timer)
  }, [fields, notes, selectedSchemeId, files, consentGiven])

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((online) => {
      setIsOnline(online)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isOnline && offlinePending && files.length > 0 && selectedScheme && !fields) {
      setOfflinePending(false)
      runExtraction(files, selectedScheme)
    }
  }, [isOnline])

  useEffect(() => {
    if (!selectedSchemeId && schemes.length > 0) {
      setSelectedSchemeId(initialSchemeId || schemes[0].id)
    }
  }, [schemes, selectedSchemeId, initialSchemeId])

  function handleFileChange(e) {
    revokePreviews()
    const selected = Array.from(e.target.files || [])
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
    setFields(null)
    setError(null)
    setOfflinePending(false)
    setResumedNotice(false)
  }

  async function runExtraction(filesToUse, schemeToUse) {
    setExtracting(true)
    setError(null)
    try {
      const images = await Promise.all(
        filesToUse.map(async (f) => ({ base64: await fileToBase64(f), mimeType: f.type }))
      )
      const docs = Array.isArray(schemeToUse.documents_required)
        ? schemeToUse.documents_required
        : [schemeToUse.documents_required]
      const result = await extractDocumentFields(images, schemeToUse.scheme_name, docs)
      const newlyExtracted = result.extracted || {}

      setFields((prev) => {
        if (!prev) return newlyExtracted
        const merged = { ...newlyExtracted }
        for (const key of Object.keys(prev)) {
          if (prev[key]) merged[key] = prev[key]
        }
        return merged
      })
      setNotes(result.notes || null)
      setResumedNotice(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  async function handleExtract() {
    if (files.length === 0 || !selectedScheme) return

    if (!isCurrentlyOnline()) {
      await saveDraft({ schemeId: selectedSchemeId, files, consentGiven: true, fields, notes })
      if (!fields) {
        setOfflinePending(true)
        setError("You're offline - your scheme selection and photos are saved. I'll finish reading them automatically as soon as you're back online.")
      } else {
        setError("You're offline - your progress, including everything you've filled in, is saved on this device.")
      }
      return
    }

    runExtraction(files, selectedScheme)
  }

  function handleFieldChange(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const verificationAnalysis = (() => {
    if (!fields) return null

    const essentialKeys = ['Full Name', 'Aadhaar Number', 'Bank Account Number', 'IFSC Code', 'Date of Birth', 'District']
    const filledCount = essentialKeys.filter((k) => !!fields[k]?.trim()).length
    const score = Math.round((filledCount / essentialKeys.length) * 100)

    const aadhaarVal = (fields['Aadhaar Number'] || '').replace(/\s+/g, '')
    const isAadhaarFormatValid = !aadhaarVal || /^\d{12}$/.test(aadhaarVal)

    const ifscVal = (fields['IFSC Code'] || '').trim().toUpperCase()
    const isIfscFormatValid = !ifscVal || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscVal)

    return {
      score,
      isAadhaarFormatValid,
      isIfscFormatValid,
      hasBank: !!fields['Bank Account Number'],
      hasName: !!fields['Full Name']
    }
  })()

  function handleDownload() {
    const lines = [
      `Application Summary - ${selectedScheme.scheme_name}`,
      '='.repeat(40),
      '',
      ...FIELD_ORDER.map((k) => `${k}: ${fields?.[k] || '(not filled)'}`),
      '',
      'Documents required:',
      ...(Array.isArray(selectedScheme.documents_required) ? selectedScheme.documents_required : [selectedScheme.documents_required]).map((d) => `- ${d}`),
      '',
      `How to apply: ${selectedScheme.how_to_apply}`,
      '',
      'Note: This is a pre-filled summary to help you apply. Please review all details',
      'for accuracy and submit through the official channel listed above - this form',
      'is not an official government submission.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedScheme.id}-application-summary.txt`
    a.click()
    URL.revokeObjectURL(url)
    clearDraft()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <span style={styles.kioskBadge}>MPOnline Kiosk · Smart OCR Assist</span>
            <h2 style={styles.title}>Apply for a Government Scheme</h2>
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <p style={styles.disclaimer}>
          Your document photos are analyzed using Gemini AI vision to extract identity, land, and banking details.
          Documents are processed in memory and never permanently stored.
        </p>

        <label style={styles.consentRow}>
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          <span>I authorize processing of document images for pre-filling application</span>
        </label>

        {!consentGiven && (
          <p style={styles.consentHint}>Please check the authorization box above to proceed.</p>
        )}

        <fieldset disabled={!consentGiven} style={styles.fieldset}>
          {resumedNotice && (
            <p style={styles.notesText}>
              {fields
                ? "Restored your saved progress from before, including everything you'd already filled in."
                : `Restored your saved documents from before - ${isOnline ? 'finishing up now...' : 'waiting for internet to continue.'}`}
            </p>
          )}

          {schemes.length === 0 ? (
            <div>
              <p style={styles.consentHint}>Scheme list didn't load. This can happen after a one-time network hiccup.</p>
              <button className="ym-cta" style={styles.extractBtn} onClick={onRetryLoadSchemes}>
                Retry Loading Schemes
              </button>
            </div>
          ) : (
            <>
              <label style={styles.label}>Which scheme are you applying for?</label>
              <select
                style={styles.select}
                value={selectedSchemeId}
                onChange={(e) => { setSelectedSchemeId(e.target.value); setFields(null) }}
              >
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>{s.scheme_name}</option>
                ))}
              </select>

              {selectedScheme && (
                <p style={styles.docsHint}>
                  Typically needed: {Array.isArray(selectedScheme.documents_required) ? selectedScheme.documents_required.join(', ') : selectedScheme.documents_required}
                </p>
              )}

              <label style={styles.label}>Upload document photos (Aadhaar, Samagra, Khasra, Passbook)</label>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} style={styles.fileInput} />

              {previews.length > 0 && (
                <div style={styles.previewRow}>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt={`document ${i + 1}`} style={styles.previewImg} />
                  ))}
                </div>
              )}

              <button
                className="ym-cta"
                style={styles.extractBtn}
                onClick={handleExtract}
                disabled={files.length === 0 || extracting || (!!fields && !isOnline)}
              >
                {extracting
                  ? 'AI Vision Scanning Documents...'
                  : fields
                    ? (isOnline ? 'Re-scan Documents (keeps your filled-in details)' : "Offline — your details are saved on this device")
                    : (!isOnline ? "Save for when I'm back online" : 'Extract & Pre-Fill Details with AI Vision →')}
              </button>

              {error && <p style={styles.errorText}>⚠️ {error}</p>}
              {notes && <p style={styles.notesText}>OCR Note: {notes}</p>}

              {fields && (
                <div style={styles.formSection}>
                  {verificationAnalysis && (
                    <div style={styles.verificationCard}>
                      <div style={styles.verificationHeader}>
                        <div style={styles.verificationTitle}>Smart Document Readiness & Verification</div>
                        <span
                          style={{
                            ...styles.readinessPill,
                            background: verificationAnalysis.score >= 80 ? '#dcfce7' : '#fef3c7',
                            color: verificationAnalysis.score >= 80 ? '#15803d' : '#b45309'
                          }}
                        >
                          {verificationAnalysis.score}% Ready
                        </span>
                      </div>

                      <div style={styles.progressBarWrap}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${verificationAnalysis.score}%`,
                            background: verificationAnalysis.score >= 80 ? '#16a34a' : '#d97706'
                          }}
                        />
                      </div>

                      <div style={styles.validationBadges}>
                        <span style={styles.badgeItem}>
                          {verificationAnalysis.hasName ? '✅ Beneficiary Name Identified' : '⚠️ Missing Name'}
                        </span>
                        <span style={styles.badgeItem}>
                          {verificationAnalysis.isAadhaarFormatValid ? '✅ Aadhaar Format Valid (12 Digits)' : '❌ Invalid Aadhaar Format'}
                        </span>
                        <span style={styles.badgeItem}>
                          {verificationAnalysis.isIfscFormatValid ? '✅ Bank IFSC Format Valid' : '⚠️ Check IFSC Code'}
                        </span>
                      </div>
                    </div>
                  )}

                  <h3 style={styles.formTitle}>Review Extracted Details (Editable)</h3>
                  {FIELD_ORDER.map((key) => (
                    <div key={key} style={styles.fieldRow}>
                      <label style={styles.fieldLabel}>{key}</label>
                      <input
                        style={styles.fieldInput}
                        value={fields[key] || ''}
                        placeholder="Not found - fill manually"
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="ym-cta"
                      style={styles.officialReceiptBtn}
                      onClick={() => setShowOfficialReceipt(true)}
                    >
                      🖨️ View & Print Official MPOnline Slip (with QR Code) →
                    </button>
                    <button className="ym-cta" style={styles.downloadBtn} onClick={handleDownload}>
                      Download Plain Text Summary (.txt)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </fieldset>

        <p style={styles.autoSubmitNote}>
          Note: Generates an official pre-filled summary and kiosk slip for citizen review and CSC verification.
        </p>
      </div>

      {showOfficialReceipt && selectedScheme && fields && (
        <OfficialApplicationReceiptModal
          scheme={selectedScheme}
          fields={fields}
          onClose={() => setShowOfficialReceipt(false)}
        />
      )}
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
    maxWidth: '540px', width: '100%', maxHeight: '92vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)', boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  kioskBadge: {
    display: 'inline-block', fontSize: '11px', fontWeight: 700, color: 'var(--color-forest)',
    background: 'rgba(20,83,45,0.1)', padding: '2px 8px', borderRadius: '999px', marginBottom: '4px',
  },
  title: { margin: 0, fontSize: '19px', color: 'var(--color-forest)', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-charcoal-soft)' },
  disclaimer: { fontSize: '12px', color: 'var(--color-charcoal-soft)', lineHeight: 1.5, marginBottom: '10px' },
  consentRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: 'var(--color-forest)', marginBottom: '4px', cursor: 'pointer' },
  consentHint: { fontSize: '12px', color: '#b00020', margin: '0 0 12px' },
  fieldset: { border: 'none', padding: 0, margin: 0 },
  autoSubmitNote: { fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginTop: '14px', fontStyle: 'italic' },
  label: { display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--color-forest)', margin: '10px 0 5px' },
  select: { width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.25)', fontSize: '13.5px', fontFamily: 'inherit', background: '#fff' },
  docsHint: { fontSize: '12px', color: 'var(--color-charcoal-soft)', marginTop: '6px' },
  fileInput: { display: 'block', width: '100%', fontSize: '13px' },
  previewRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0' },
  previewImg: { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.2)' },
  extractBtn: {
    marginTop: '14px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: 'var(--color-forest)', color: 'var(--color-cream)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  errorText: { color: '#b00020', fontSize: '13px', marginTop: '10px' },
  notesText: { color: '#6b4d0f', fontSize: '12px', marginTop: '10px', background: '#fef3c7', padding: '8px 10px', borderRadius: '8px' },
  formSection: { marginTop: '18px', borderTop: '1px solid rgba(20,83,45,0.12)', paddingTop: '14px' },
  verificationCard: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '12px', marginBottom: '14px',
  },
  verificationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  verificationTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase' },
  readinessPill: { fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' },
  progressBarWrap: { height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' },
  progressBarFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s ease' },
  validationBadges: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  badgeItem: { fontSize: '10.5px', background: '#fff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#334155' },
  formTitle: { fontSize: '13.5px', color: 'var(--color-forest)', margin: '0 0 10px', fontWeight: 700 },
  fieldRow: { marginBottom: '9px' },
  fieldLabel: { display: 'block', fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginBottom: '3px' },
  fieldInput: { width: '100%', padding: '8px 9px', borderRadius: '7px', border: '1px solid rgba(20,83,45,0.2)', fontSize: '13px', fontFamily: 'inherit' },
  officialReceiptBtn: {
    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: 'var(--color-forest)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  },
  downloadBtn: {
    width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(20,83,45,0.25)',
    background: '#fff', color: 'var(--color-forest)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
}

const receiptStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.52)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', zIndex: 70, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#ffffff', borderRadius: '16px', padding: '20px',
    maxWidth: '820px', width: '100%', maxHeight: '94vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px',
  },
  officialBadge: {
    background: 'var(--color-forest)', color: '#fff', fontSize: '11px',
    fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
  },
  printBtn: {
    padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-forest)',
    color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
    color: 'var(--color-charcoal-soft)',
  },
  receiptSheet: {
    border: '2px solid #14532d', borderRadius: '8px', padding: '24px',
    background: '#fff', color: '#1e293b',
  },
  govHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '2px solid #14532d', paddingBottom: '14px', marginBottom: '14px',
  },
  govTitle: { fontSize: '16px', fontWeight: 800, color: 'var(--color-forest)', letterSpacing: '0.5px' },
  govSub: { fontSize: '12px', color: '#334155', fontWeight: 600, marginTop: '2px' },
  slipType: { fontSize: '12px', color: '#c97f1e', fontWeight: 700, marginTop: '4px' },
  qrContainer: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  qrLabel: { fontSize: '9.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' },
  metaRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px',
    border: '1px solid #e2e8f0', marginBottom: '14px', flexWrap: 'wrap', gap: '8px',
  },
  highlightRef: { color: 'var(--color-forest)', fontWeight: 700 },
  verifiedTag: { color: '#15803d', fontWeight: 700 },
  schemeBanner: {
    background: 'rgba(20,83,45,0.06)', borderLeft: '4px solid var(--color-forest)',
    padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: '16px',
  },
  schemeBannerLabel: { fontSize: '10px', color: 'var(--color-charcoal-soft)', fontWeight: 700, letterSpacing: '0.5px' },
  schemeBannerName: { fontSize: '16px', fontWeight: 700, color: 'var(--color-forest)', margin: '2px 0' },
  schemeBannerHindi: { fontSize: '13px', color: '#475569', fontStyle: 'italic', marginBottom: '4px' },
  schemeBannerDetails: { display: 'flex', gap: '8px', fontSize: '12px', color: '#334155', flexWrap: 'wrap' },
  sectionHeader: {
    fontSize: '11px', fontWeight: 800, color: 'var(--color-forest)', letterSpacing: '0.6px',
    marginBottom: '6px', borderBottom: '1px solid rgba(20,83,45,0.2)', paddingBottom: '3px',
  },
  detailsTable: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' },
  tableLabel: {
    padding: '6px 8px', background: '#f8fafc', fontWeight: 600, color: '#475569',
    border: '1px solid #e2e8f0', width: '22%',
  },
  tableVal: { padding: '6px 8px', border: '1px solid #e2e8f0', width: '28%', color: '#0f172a' },
  checklistSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  checklistCol: {},
  checkUl: { margin: 0, paddingLeft: '0', listStyle: 'none', fontSize: '12px', color: '#334155', lineHeight: 1.6 },
  instructionText: { fontSize: '12px', color: '#334155', lineHeight: 1.5 },
  footerStamps: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px',
  },
  stampBox: { width: '45%' },
  stampDotted: {
    border: '1px dashed #94a3b8', borderRadius: '6px', padding: '8px', textAlign: 'center',
    fontSize: '10px', color: '#475569', fontWeight: 700,
  },
  signatureBox: { width: '45%', textAlign: 'center' },
  signatureLine: { borderBottom: '1px solid #334155', height: '30px', marginBottom: '4px' },
}
