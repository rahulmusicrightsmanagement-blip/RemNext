import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from '../styles/Auth.module.css'
import { api } from '../lib/api'

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function ResetPassword() {
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setSubmitting(true)
    try {
      const data = await api<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      })
      setSuccess(data.message)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h2>Invalid Link</h2>
        <p className={styles.subtitle}>This reset link is invalid or has expired.</p>
        <p className={styles.switchText}><Link to="/forgot-password">Request a new one</Link></p>
      </div>
    </div>
  )

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h2>Reset Password</h2>
        <p className={styles.subtitle}>Enter your new password below</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 14, color: '#43a047', marginBottom: 8 }}>{success}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            <label>Confirm Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
