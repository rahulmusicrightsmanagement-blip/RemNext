import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { api, apiFormData } from '../lib/api'
import styles from '../styles/Profile.module.css'

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
  { code: '+65',  flag: '🇸🇬', name: 'Singapore'              },
  { code: '+971', flag: '🇦🇪', name: 'UAE'                    },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa'           },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan'               },
]

const COUNTRIES = [
  'United States','United Kingdom','India','Canada','Australia','Germany','France',
  'Brazil','Mexico','Japan','China','South Korea','Singapore','UAE','South Africa',
  'Nigeria','Kenya','Pakistan','Bangladesh','Philippines','Indonesia','Malaysia',
  'Thailand','New Zealand','Netherlands','Sweden','Norway','Denmark','Switzerland',
  'Italy','Spain','Portugal','Poland','Argentina','Chile','Colombia','Other',
]

interface ProfileData {
  phoneCode: string
  phone: string
  street: string; road: string; city: string; state: string; country: string; zipCode: string
  profilePhoto?: string | null
}

const empty: ProfileData = {
  phoneCode: '+1', phone: '',
  street: '', road: '', city: '', state: '', country: '', zipCode: '',
  profilePhoto: null,
}

function ManagerProfile() {
  const { user, token, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProfileData>(empty)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [phoneDropOpen, setPhoneDropOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const phoneBtnRef = useRef<HTMLButtonElement>(null)

  const set = (key: keyof ProfileData, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    api<{ profile: ProfileData | null }>('/profile', { token: token! })
      .then(d => {
        if (d.profile) setForm({ ...empty, ...d.profile })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.phone) { setError('Phone number is required.'); toast.error('Phone number is required.'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('phoneCode', form.phoneCode)
      fd.append('phone', form.phone)
      fd.append('street', form.street)
      fd.append('road', form.road)
      fd.append('city', form.city)
      fd.append('state', form.state)
      fd.append('country', form.country)
      fd.append('zipCode', form.zipCode)
      await apiFormData<{ profile: ProfileData }>('/profile', {
        method: 'PUT', formData: fd, token: token!,
      })

      await refreshProfile()
      setSuccess('Profile saved successfully!')
      toast.success('Profile saved successfully!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      setError(msg)
      toast.error(msg)
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

      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/manager/dashboard')}>← Back</button>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Manager Profile</h1>
          <p className={styles.pageSubtitle}>Manage your account details</p>
        </div>
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
              <label>Role</label>
              <input value="Manager" readOnly />
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number <span className={styles.required}>*</span></label>
              <div className={styles.phoneWrapper}>
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
              <p className={styles.sectionSubtitle}>Your office or residential address</p>
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Street / House No.</label>
              <input placeholder="123 Main Street" value={form.street} onChange={e => set('street', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Road / Area / Locality</label>
              <input placeholder="e.g. Oak Road, Sector 12" value={form.road} onChange={e => set('road', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>City</label>
              <input placeholder="e.g. New York" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>State / Province</label>
              <input placeholder="e.g. California" value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}>
                <option value="">Select country...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>ZIP / PIN Code</label>
              <input placeholder="e.g. 10001" value={form.zipCode} onChange={e => set('zipCode', e.target.value)} />
            </div>
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/manager/dashboard')}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}

export default ManagerProfile
