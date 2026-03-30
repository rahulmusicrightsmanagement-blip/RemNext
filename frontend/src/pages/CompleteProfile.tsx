import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, apiFormData } from '../lib/api'
import styles from '../styles/Profile.module.css'

/* ─── Constants ─── */
const DOCUMENT_TYPES = [
  { value: 'driving_license', label: 'Driving License', icon: '🪪' },
  { value: 'student_id',      label: 'Student ID',      icon: '🎓' },
  { value: 'passport',        label: 'Passport',         icon: '📘' },
  { value: 'government_id',   label: 'Govt. ID',         icon: '🏛️' },
]

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

/* ─── Helpers ─── */
function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.75): Promise<Blob> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), type, quality)
  })
}

function compressImageFile(file: File, maxDim = 480): Promise<File> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = async () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const blob = await canvasToBlob(canvas)
      resolve(new File([blob], file.name, { type: 'image/jpeg' }))
    }
    img.src = url
  })
}

/* ─── Types ─── */
interface ProfileData {
  profilePhoto: string
  phoneCode: string
  phone: string
  street: string; road: string; city: string; state: string; country: string; zipCode: string
  documentType: string; documentValue: string; documentFileData: string
  resumeUrl: string
  bankAccountName: string; bankAccountNumber: string
  bankRoutingNumber: string; bankSwiftCode: string
  paypalEmail: string
  ssnId: string
  isComplete: boolean
}

const empty: ProfileData = {
  profilePhoto: '', phoneCode: '+1', phone: '',
  street: '', road: '', city: '', state: '', country: '', zipCode: '',
  documentType: '', documentValue: '', documentFileData: '',
  resumeUrl: '',
  bankAccountName: '', bankAccountNumber: '', bankRoutingNumber: '', bankSwiftCode: '',
  paypalEmail: '', ssnId: '',
  isComplete: false,
}

/* ─── Camera Modal ─── */
function CameraModal({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState('')

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; setReady(true) }
      })
      .catch(() => setCamError('Camera access denied. Please allow camera permission and try again.'))
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  const capture = async () => {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9)
    const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' })
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(file)
  }

  return (
    <div className={styles.camOverlay} onClick={onClose}>
      <div className={styles.camModal} onClick={e => e.stopPropagation()}>
        <div className={styles.camHeader}>
          <span className={styles.camTitle}>Take Photo</span>
          <button className={styles.camClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.camBody}>
          {camError
            ? <p className={styles.camError}>{camError}</p>
            : <>
                <video ref={videoRef} autoPlay playsInline muted className={styles.camVideo} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
          }
        </div>
        {!camError && (
          <div className={styles.camFooter}>
            <button type="button" className={styles.captureBtn} onClick={capture} disabled={!ready}>
              <span className={styles.captureRing}><span className={styles.captureInner} /></span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
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
  const [showCamera, setShowCamera] = useState(false)
  const [phoneDropOpen, setPhoneDropOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const phoneBtnRef = useRef<HTMLButtonElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  // File objects to upload (kept separate from form text data)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentFilePreview, setDocumentFilePreview] = useState('')
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
          if (d.profile.profilePhoto) setProfilePhotoPreview(d.profile.profilePhoto)
          if (d.profile.documentFileData) setDocumentFilePreview(d.profile.documentFileData)
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

  /* Document upload handler */
  const handleDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      const compressed = await compressImageFile(file, 1200)
      setDocumentFile(compressed)
      setDocumentFilePreview(URL.createObjectURL(compressed))
    } else {
      setDocumentFile(file)
      setDocumentFilePreview('pdf')
    }
    set('documentFileData', file.name) // placeholder
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.phone) { setError('Phone number is required.'); return }
    if (!form.street || !form.city || !form.state || !form.country || !form.zipCode) {
      setError('All address fields (except Road/Area) are required.'); return
    }
    if (!form.documentType || !form.documentValue) {
      setError('Please select a document type and provide the document number.'); return
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
      fd.append('documentType', form.documentType)
      fd.append('documentValue', form.documentValue)
      fd.append('bankAccountName', form.bankAccountName)
      fd.append('bankAccountNumber', form.bankAccountNumber)
      fd.append('bankRoutingNumber', form.bankRoutingNumber)
      fd.append('bankSwiftCode', form.bankSwiftCode)
      fd.append('paypalEmail', form.paypalEmail)
      fd.append('ssnId', form.ssnId)

      // Append files if selected, otherwise signal removal
      if (profilePhotoFile) {
        fd.append('profilePhoto', profilePhotoFile)
      } else if (!profilePhotoPreview) {
        fd.append('removeProfilePhoto', 'true')
      }

      if (documentFile) {
        fd.append('documentFile', documentFile)
      } else if (!documentFilePreview) {
        fd.append('removeDocumentFile', 'true')
      }

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
      if (result.profile.profilePhoto) setProfilePhotoPreview(result.profile.profilePhoto)
      if (result.profile.documentFileData) setDocumentFilePreview(result.profile.documentFileData)
      if (result.profile.resumeUrl) setResumeFileName(result.profile.resumeUrl)
      setProfilePhotoFile(null)
      setDocumentFile(null)
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
      {showCamera && (
        <CameraModal
          onCapture={file => {
            setProfilePhotoFile(file)
            setProfilePhotoPreview(URL.createObjectURL(file))
            set('profilePhoto', file.name)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

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

        {/* ── Profile Photo ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>📷</div>
            <div>
              <p className={styles.sectionTitle}>Profile Photo</p>
              <p className={styles.sectionSubtitle}>Take a live photo using your camera</p>
            </div>
          </div>
          <div className={styles.photoRow}>
            <div className={styles.photoPreviewWrap}>
              {profilePhotoPreview
                ? <img src={profilePhotoPreview} alt="Profile" className={styles.photoPreview} />
                : <div className={styles.photoPlaceholder}>
                    <span style={{ fontSize: 36 }}>👤</span>
                    <span className={styles.photoPlaceholderText}>No photo</span>
                  </div>
              }
            </div>
            <div className={styles.photoActions}>
              <button type="button" className={styles.photoBtn} onClick={() => setShowCamera(true)}>
                📷 Take Live Photo
              </button>
              {profilePhotoPreview && (
                <button type="button" className={styles.photoRemoveBtn} onClick={() => {
                  setProfilePhotoFile(null)
                  setProfilePhotoPreview('')
                  set('profilePhoto', '')
                }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

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

        {/* ── Identity Document ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>🪪</div>
            <div>
              <p className={styles.sectionTitle}>Identity Document</p>
              <p className={styles.sectionSubtitle}>Select one document type and upload a copy (mandatory)</p>
            </div>
          </div>

          <div className={styles.docOptions}>
            {DOCUMENT_TYPES.map(doc => (
              <div
                key={doc.value}
                className={`${styles.docOption} ${form.documentType === doc.value ? styles.docOptionSelected : ''}`}
                onClick={() => set('documentType', doc.value)}
              >
                <div className={styles.docOptionIcon}>{doc.icon}</div>
                <div className={styles.docOptionLabel}>{doc.label}</div>
              </div>
            ))}
          </div>

          {form.documentType && (
            <div className={styles.docFields}>
              <div className={styles.formGroup}>
                <label>
                  {DOCUMENT_TYPES.find(d => d.value === form.documentType)?.label} Number
                  <span className={styles.required}> *</span>
                </label>
                <input
                  placeholder="Enter document number"
                  value={form.documentValue}
                  onChange={e => set('documentValue', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Upload Document Photo / Scan</label>
                <div
                  className={styles.docUploadZone}
                  onClick={() => docInputRef.current?.click()}
                >
                  {documentFilePreview ? (
                    <div className={styles.docPreviewRow}>
                      {documentFilePreview === 'pdf'
                        ? <span style={{ fontSize: 36 }}>📄</span>
                        : <img src={documentFilePreview} alt="Document" className={styles.docPreviewImg} />
                      }
                      <button
                        type="button"
                        className={styles.docRemoveBtn}
                        onClick={e => { e.stopPropagation(); setDocumentFile(null); setDocumentFilePreview(''); set('documentFileData', '') }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className={styles.docUploadPrompt}>
                      <span style={{ fontSize: 28 }}>⬆</span>
                      <span className={styles.docUploadText}>Click to upload document image</span>
                      <span className={styles.docUploadSub}>JPG, PNG, PDF screenshot — max 5MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleDocFile}
                />
              </div>
            </div>
          )}
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
