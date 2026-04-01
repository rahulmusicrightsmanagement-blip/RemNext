import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, apiFormData } from '../lib/api'
import styles from '../styles/Profile.module.css'

/* ─── Constants ─── */

const PHONE_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom'         },
  { code: '+91',  flag: '🇮🇳', name: 'India'                  },
  { code: '+61',  flag: '🇦🇺', name: 'Australia'              },
  { code: '+49',  flag: '🇩🇪', name: 'Germany'                },
  { code: '+33',  flag: '🇫🇷', name: 'France'                 },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil'                 },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico'                 },
  { code: '+81',  flag: '🇯🇵', name: 'Japan'                  },
  { code: '+86',  flag: '🇨🇳', name: 'China'                  },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea'            },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore'              },
  { code: '+971', flag: '🇦🇪', name: 'UAE'                    },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa'           },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria'                },
  { code: '+254', flag: '🇰🇪', name: 'Kenya'                  },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan'               },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh'             },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines'            },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia'              },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia'               },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand'               },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand'            },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands'            },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden'                 },
  { code: '+47',  flag: '🇳🇴', name: 'Norway'                 },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark'                },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland'            },
  { code: '+39',  flag: '🇮🇹', name: 'Italy'                  },
  { code: '+34',  flag: '🇪🇸', name: 'Spain'                  },
  { code: '+351', flag: '🇵🇹', name: 'Portugal'               },
  { code: '+48',  flag: '🇵🇱', name: 'Poland'                 },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina'              },
  { code: '+56',  flag: '🇨🇱', name: 'Chile'                  },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia'               },
]

const COUNTRIES = [
  'United States','United Kingdom','India','Canada','Australia','Germany','France',
  'Brazil','Mexico','Japan','China','South Korea','Singapore','UAE','South Africa',
  'Nigeria','Kenya','Pakistan','Bangladesh','Philippines','Indonesia','Malaysia',
  'Thailand','New Zealand','Netherlands','Sweden','Norway','Denmark','Switzerland',
  'Italy','Spain','Portugal','Poland','Argentina','Chile','Colombia','Other',
]

/* ─── Types ─── */
interface ProfileData {
  phoneCode: string
  phone: string
  street: string; road: string; city: string; state: string; country: string; zipCode: string
  resumeUrl: string
  bankAccountName: string; bankAccountNumber: string
  bankRoutingNumber: string; bankSwiftCode: string
  paypalEmail: string
  ssnId: string
  isComplete: boolean
}

const empty: ProfileData = {
  phoneCode: '+1', phone: '',
  street: '', road: '', city: '', state: '', country: '', zipCode: '',
  resumeUrl: '',
  bankAccountName: '', bankAccountNumber: '', bankRoutingNumber: '', bankSwiftCode: '',
  paypalEmail: '', ssnId: '',
  isComplete: false,
}

/* ─── Main Component ─── */
function CompleteProfile() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProfileData>(empty)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [phoneDropOpen, setPhoneDropOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const phoneBtnRef = useRef<HTMLButtonElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  // File objects to upload (kept separate from form text data)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeFileName, setResumeFileName] = useState('')

  const isUS = form.country === 'United States'
  const set = (key: keyof ProfileData, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    api<{ profile: ProfileData | null }>('/profile', { token: token! })
      .then(d => {
        if (d.profile) {
          setForm({ ...empty, ...d.profile })
          if (d.profile.resumeUrl) setResumeFileName(d.profile.resumeUrl)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  /* Resume upload handler */
  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Resume file must be under 5MB'); return }
    setResumeFile(file)
    setResumeFileName(file.name)
    set('resumeUrl', file.name) // placeholder so validation passes
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.phone) { setError('Phone number is required.'); return }
    if (!form.street || !form.city || !form.state || !form.country || !form.zipCode) {
      setError('All address fields (except Road/Area) are required.'); return
    }
    if (!form.resumeUrl && !resumeFile) { setError('Resume is required — upload a file or paste a link.'); return }
    if (!form.bankAccountName && !form.bankAccountNumber && !form.paypalEmail) {
      setError('Please fill in at least one payment method.'); return
    }
    if (isUS && !form.ssnId) { setError('SSN is required for US residents.'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()

      // Append text fields
      fd.append('phoneCode', form.phoneCode)
      fd.append('phone', form.phone)
      fd.append('street', form.street)
      fd.append('road', form.road)
      fd.append('city', form.city)
      fd.append('state', form.state)
      fd.append('country', form.country)
      fd.append('zipCode', form.zipCode)
      fd.append('bankAccountName', form.bankAccountName)
      fd.append('bankAccountNumber', form.bankAccountNumber)
      fd.append('bankRoutingNumber', form.bankRoutingNumber)
      fd.append('bankSwiftCode', form.bankSwiftCode)
      fd.append('paypalEmail', form.paypalEmail)
      fd.append('ssnId', form.ssnId)

      // Append resume file if selected
      if (resumeFile) {
        fd.append('resumeFile', resumeFile)
      } else if (form.resumeUrl && !form.resumeUrl.startsWith('data:') && !resumeFile) {
        // User pasted a URL
        fd.append('resumeUrl', form.resumeUrl)
      } else if (!resumeFileName) {
        fd.append('removeResume', 'true')
      }

      const result = await apiFormData<{ profile: ProfileData }>('/profile', {
        method: 'PUT', formData: fd, token: token!,
      })

      // Update previews with the S3 URLs returned from the server
      if (result.profile.resumeUrl) setResumeFileName(result.profile.resumeUrl)
      setResumeFile(null)
      setForm({ ...empty, ...result.profile })

      setSuccess('Profile saved successfully!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <p style={{ color: '#B0ACB6', textAlign: 'center', paddingTop: 80 }}>Loading profile...</p>
    </div>
  )

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/user/dashboard')}>← Back</button>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Complete Profile</h1>
          <p className={styles.pageSubtitle}>Fill in all details to unlock tasks and payments</p>
        </div>
        {form.isComplete
          ? <span className={styles.completeBadge}>✓ Profile Complete</span>
          : <span className={styles.incompleteBadge}>⚠ Incomplete</span>
        }
      </div>

      {success && <p className={styles.successMsg}>{success}</p>}

      <form onSubmit={handleSubmit}>

        {/* ── Personal Info ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>👤</div>
            <div>
              <p className={styles.sectionTitle}>Personal Information</p>
              <p className={styles.sectionSubtitle}>Basic identity details</p>
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input value={user?.name ?? ''} readOnly />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input value={user?.email ?? ''} readOnly />
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number <span className={styles.required}>*</span></label>
              <div className={styles.phoneWrapper}>
                {/* Country code dropdown trigger */}
                <button
                  type="button"
                  ref={phoneBtnRef}
                  className={styles.phoneFlagBtn}
                  onClick={() => {
                    const rect = phoneBtnRef.current!.getBoundingClientRect()
                    setDropPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX })
                    setPhoneDropOpen(o => !o)
                  }}
                >
                  <span className={styles.phoneFlagEmoji}>
                    {PHONE_CODES.find(p => p.code === form.phoneCode)?.flag ?? '🌍'}
                  </span>
                  <span className={styles.phoneCodeText}>{form.phoneCode}</span>
                  <svg className={styles.phoneCaret} width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="#58395B" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Dropdown list — rendered in a portal to escape stacking context */}
                {phoneDropOpen && createPortal(
                  <>
                    <div className={styles.phoneBackdrop} onClick={() => setPhoneDropOpen(false)} />
                    <div className={styles.phoneDropdown} style={{ top: dropPos.top, left: dropPos.left }}>
                      {PHONE_CODES.map(p => (
                        <div
                          key={p.code}
                          className={`${styles.phoneDropItem} ${form.phoneCode === p.code ? styles.phoneDropItemActive : ''}`}
                          onClick={() => { set('phoneCode', p.code); setPhoneDropOpen(false) }}
                        >
                          <span className={styles.phoneDropFlag}>{p.flag}</span>
                          <span className={styles.phoneDropCode}>{p.code}</span>
                          <span className={styles.phoneDropLabel}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </>,
                  document.body
                )}

                <div className={styles.phoneDivider} />
                <input
                  className={styles.phoneInput}
                  type="tel"
                  placeholder="234 567 8900"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Address ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>🏠</div>
            <div>
              <p className={styles.sectionTitle}>Address</p>
              <p className={styles.sectionSubtitle}>Your residential address</p>
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Street / House No. <span className={styles.required}>*</span></label>
              <input placeholder="123 Main Street" value={form.street} onChange={e => set('street', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Road / Area / Locality</label>
              <input placeholder="e.g. Oak Road, Sector 12" value={form.road} onChange={e => set('road', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>City <span className={styles.required}>*</span></label>
              <input placeholder="e.g. New York" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>State / Province <span className={styles.required}>*</span></label>
              <input placeholder="e.g. California" value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Country <span className={styles.required}>*</span></label>
              <select value={form.country} onChange={e => set('country', e.target.value)}>
                <option value="">Select country...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>ZIP / PIN Code <span className={styles.required}>*</span></label>
              <input placeholder="e.g. 10001" value={form.zipCode} onChange={e => set('zipCode', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Resume ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>📄</div>
            <div>
              <p className={styles.sectionTitle}>Resume</p>
              <p className={styles.sectionSubtitle}>Upload your CV or paste a link <span className={styles.required}>*</span></p>
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={styles.docUploadZone}
            style={{ marginBottom: 14 }}
            onClick={() => resumeInputRef.current?.click()}
          >
            {(resumeFile || resumeFileName) ? (
              <div className={styles.docPreviewRow}>
                <span style={{ fontSize: 36 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2D253C', margin: 0 }}>
                    {resumeFile ? resumeFile.name : 'Resume uploaded'}
                  </p>
                  <p style={{ fontSize: 11, color: '#B0ACB6', margin: '2px 0 0' }}>Click to replace</p>
                </div>
                <button
                  type="button"
                  className={styles.docRemoveBtn}
                  onClick={e => { e.stopPropagation(); setResumeFile(null); setResumeFileName(''); set('resumeUrl', '') }}
                >✕ Remove</button>
              </div>
            ) : (
              <div className={styles.docUploadPrompt}>
                <span style={{ fontSize: 32 }}>⬆</span>
                <span className={styles.docUploadText}>Click to upload resume</span>
                <span className={styles.docUploadSub}>PDF, DOC, DOCX — max 5MB</span>
              </div>
            )}
          </div>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={handleResumeFile}
          />

          <div className={styles.orDivider}><span>OR paste a link</span></div>

          <div className={styles.formGroup}>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={resumeFile ? '' : (resumeFileName?.startsWith('http') ? '' : form.resumeUrl)}
              onChange={e => { set('resumeUrl', e.target.value); setResumeFile(null); setResumeFileName('') }}
            />
            <span className={styles.fieldNote}>Google Drive, Dropbox, or OneDrive shareable link</span>
          </div>
        </div>

        {/* ── Payment Details ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>💳</div>
            <div>
              <p className={styles.sectionTitle}>Payment Details</p>
              <p className={styles.sectionSubtitle}>How you'll receive your earnings</p>
            </div>
          </div>

          <div className={styles.payBlock}>
            <p className={styles.payBlockTitle}>🏦 Bank Account</p>
            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label>Account Holder Name</label>
                <input placeholder="Full name as on bank account" value={form.bankAccountName} onChange={e => set('bankAccountName', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Account Number</label>
                <input placeholder="Enter account number" value={form.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} />
              </div>
              {isUS ? (
                <div className={styles.formGroup}>
                  <label>Routing Number</label>
                  <input placeholder="9-digit ABA routing number" value={form.bankRoutingNumber} onChange={e => set('bankRoutingNumber', e.target.value)} />
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label>SWIFT / BIC Code</label>
                  <input placeholder="e.g. HDFC0001234" value={form.bankSwiftCode} onChange={e => set('bankSwiftCode', e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.payBlock}>
            <p className={styles.payBlockTitle}>💙 PayPal</p>
            <div className={styles.formGroup}>
              <label>PayPal Email</label>
              <input type="email" placeholder="your@paypal.com" value={form.paypalEmail} onChange={e => set('paypalEmail', e.target.value)} />
            </div>
          </div>

          {isUS && (
            <div className={styles.ssnBlock}>
              <p className={styles.ssnTitle}>🇺🇸 Social Security Number (SSN)</p>
              <div className={styles.formGroup}>
                <label>SSN <span className={styles.required}>*</span></label>
                <input placeholder="XXX-XX-XXXX" value={form.ssnId} onChange={e => set('ssnId', e.target.value)} />
              </div>
              <p className={styles.ssnNote}>
                Required for US residents for tax reporting (W-9 compliance). Stored securely and never shared publicly.
              </p>
            </div>
          )}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/user/dashboard')}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}

export default CompleteProfile
