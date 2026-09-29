import { useState, useEffect } from 'react'
import { extractDocumentFields } from './lib/gemini'
import { saveDraft, loadDraft, clearDraft } from './lib/applicationDraft'
import { isCurrentlyOnline, subscribeToConnectionStatus } from './lib/offline'
import OfficialApplicationReceipt from './OfficialApplicationReceipt'

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
        <OfficialApplicationReceipt
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
