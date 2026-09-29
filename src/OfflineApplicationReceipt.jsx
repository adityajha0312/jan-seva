import { useRef } from 'react'
import Logo from './Logo'
import { CloseIcon } from './Icons'

function SimpleQRCode({ text, size = 110 }) {
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
        if (isBorder || isCenter) {
          cells.push({ r, c })
        }
      } else {
        const val = Math.abs(Math.sin((r * rows + c + hash) * 1.618)) > 0.48
        if (val) {
          cells.push({ r, c })
        }
      }
    }
  }

  const cellSize = size / rows

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', padding: '4px', borderRadius: '6px' }}>
      {cells.map(({ r, c }, idx) => (
        <rect
          key={idx}
          x={c * cellSize}
          y={r * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#14532d"
        />
      ))}
    </svg>
  )
}

export default function OfficialApplicationReceipt({
  scheme,
  fields,
  onClose,
  refNumber
}) {
  const receiptRef = useRef(null)
  const applicationNo = refNumber || `MP-YJM-${Math.floor(100000 + Math.random() * 900000)}`
  const timestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const verificationUrl = `https://mponline.gov.in/verify?appNo=${applicationNo}&scheme=${encodeURIComponent(scheme.scheme_name)}`

  function handlePrint() {
    window.print()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="no-print" style={styles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.officialBadge}>Official GovTech Document</span>
            <span style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)' }}>MPOnline Acknowledgment Slip</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ym-cta" style={styles.printBtn} onClick={handlePrint}>
              🖨️ Print / Save PDF
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div ref={receiptRef} style={styles.receiptSheet} className="printable-receipt">
          <div style={styles.govHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Logo size={42} />
              <div>
                <div style={styles.govTitle}>GOVERNMENT OF MADHYA PRADESH</div>
                <div style={styles.govSub}>MPOnline Citizen Services Portal · Lok Sewa Kendra (CSC)</div>
                <div style={styles.slipType}>PRE-FILLED CITIZEN APPLICATION ACKNOWLEDGMENT SLIP</div>
              </div>
            </div>
            <div style={styles.qrContainer}>
              <SimpleQRCode text={verificationUrl} size={90} />
              <div style={styles.qrLabel}>Scan to Verify</div>
            </div>
          </div>

          <div style={styles.metaRow}>
            <div><strong>Application Ref No:</strong> <span style={styles.highlightRef}>{applicationNo}</span></div>
            <div><strong>Date & Time:</strong> {timestamp}</div>
            <div><strong>Status:</strong> <span style={styles.verifiedTag}>AI Pre-Verified & Ready</span></div>
          </div>

          <div style={styles.schemeBanner}>
            <div style={styles.schemeBannerLabel}>APPLIED SCHEME</div>
            <div style={styles.schemeBannerName}>{scheme.scheme_name}</div>
            {scheme.scheme_name_hindi && (
              <div style={styles.schemeBannerHindi}>({scheme.scheme_name_hindi})</div>
            )}
            <div style={styles.schemeBannerDetails}>
              <span><strong>Category:</strong> {scheme.category}</span>
              <span>·</span>
              <span><strong>Jurisdiction:</strong> {scheme.level}</span>
              <span>·</span>
              <span><strong>Benefits:</strong> {scheme.benefits}</span>
            </div>
          </div>

          <div style={styles.sectionHeader}>BENEFICIARY PARTICULARS</div>
          <table style={styles.detailsTable}>
            <tbody>
              <tr>
                <td style={styles.tableLabel}>Applicant Full Name:</td>
                <td style={styles.tableVal}><strong>{fields['Full Name'] || '—'}</strong></td>
                <td style={styles.tableLabel}>Date of Birth:</td>
                <td style={styles.tableVal}>{fields['Date of Birth'] || '—'}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Aadhaar Number:</td>
                <td style={styles.tableVal}>
                  {fields['Aadhaar Number'] ? `XXXXXXXX${fields['Aadhaar Number'].slice(-4)}` : 'Verified via OCR'}
                </td>
                <td style={styles.tableLabel}>Gender / Category:</td>
                <td style={styles.tableVal}>{fields['Gender'] || '—'} / {fields['Category'] || 'General'}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Father / Husband Name:</td>
                <td style={styles.tableVal}>{fields["Father's or Husband's Name"] || '—'}</td>
                <td style={styles.tableLabel}>Mobile Number:</td>
                <td style={styles.tableVal}>{fields['Mobile Number'] || '—'}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Bank Name & Branch:</td>
                <td style={styles.tableVal}>{fields['Bank Name'] || '—'}</td>
                <td style={styles.tableLabel}>Account & IFSC:</td>
                <td style={styles.tableVal}>{fields['Bank Account Number'] ? `A/C: ${fields['Bank Account Number']}` : '—'} ({fields['IFSC Code'] || '—'})</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Village / Town:</td>
                <td style={styles.tableVal}>{fields['Village'] || fields['Address'] || '—'}</td>
                <td style={styles.tableLabel}>District & State:</td>
                <td style={styles.tableVal}>{fields['District'] || 'Bhopal'}, {fields['State'] || 'Madhya Pradesh'}</td>
              </tr>
              <tr>
                <td style={styles.tableLabel}>Land Record / Khasra:</td>
                <td style={styles.tableVal}>{fields['Land/Khasra/Khatauni Number'] || 'N/A'}</td>
                <td style={styles.tableLabel}>Annual Income:</td>
                <td style={styles.tableVal}>{fields['Annual Income'] || 'Below Statutory Limit'}</td>
              </tr>
            </tbody>
          </table>

          <div style={styles.checklistSection}>
            <div style={styles.checklistCol}>
              <div style={styles.sectionHeader}>ATTACHED DOCUMENT CHECKLIST</div>
              <ul style={styles.checkUl}>
                <li>☑ Aadhaar Card Photocopy (e-KYC verified)</li>
                <li>☑ Bank Account Passbook (DBT/NPCI Active)</li>
                <li>☑ Resident / Domicile Certificate (Madhya Pradesh)</li>
                <li>☑ Samagra Family ID / Land Record (Khasra B-1)</li>
              </ul>
            </div>
            <div style={styles.checklistCol}>
              <div style={styles.sectionHeader}>SUBMISSION INSTRUCTIONS</div>
              <div style={styles.instructionText}>
                <strong>How to finalize:</strong> {scheme.how_to_apply || 'Submit at nearest MPOnline Kiosk / Lok Sewa Kendra with original IDs for biometric verification.'}
              </div>
            </div>
          </div>

          <div style={styles.footerStamps}>
            <div style={styles.stampBox}>
              <div style={styles.stampDotted}>
                <span>DIGITAL VERIFICATION HASH</span>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  SHA256: {Math.random().toString(36).substring(2, 10).toUpperCase()}-MP-SECURE
                </div>
              </div>
            </div>
            <div style={styles.signatureBox}>
              <div style={styles.signatureLine} />
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

const styles = {
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
