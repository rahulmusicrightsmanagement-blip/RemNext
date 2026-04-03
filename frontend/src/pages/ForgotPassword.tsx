import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from '../styles/Auth.module.css'
import { api } from '../lib/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setSubmitting(true)
    try {
      const data = await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })
      setSuccess(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h2>Forgot Password</h2>
        <p className={styles.subtitle}>Enter your email and we'll send you a reset link</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 14, color: '#43a047', marginBottom: 20 }}>{success}</p>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>← Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </form>
        )}

        {!success && (
          <p className={styles.switchText}>
            <Link to="/login">← Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
