import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from '../styles/Auth.module.css'
import { useAuth } from '../context/AuthContext'

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

const TERMS_CONTENT = [
  {
    title: '1. User Registration & Onboarding',
    body: 'User Verification is not must when registering for our website. Once the User has registered on the platform after doing the email authentication, before successfully applying for any project the user will be asked to do a quick Verification using his/her documents.',
  },
  {
    title: '2. Job Matching',
    body: 'The user will get matched to a job when they successfully completed the onboarding and did the verification well. In some Jobs it might take time due to unavailability of tasks. Some tasks may require video exams which should be solved by the user.',
  },
  {
    title: '3. Compliance',
    body: 'The user can opt-out from applying their application or if they want to delete their profile permanently. The user should initiate a request on the helpdesk mail: remnxthepl@gmail.com. Once initiated, the request the user\'s account and all his legal documents will be deleted from our end after the upcoming payout dates (might take 2–3 days in case of any public holidays).',
  },
  {
    title: '4. Regulations',
    body: 'The projects we get are contract based. Once the contract is over the project will not be visible on the dashboard. The User should know that these projects can also be available on other platforms. Since the project goes from a single company to every other platform, and the user has already registered for the particular project on a different platform, they might not get hired here. Repeat applications or use of fake documents will result in permanent suspension of account.',
  },
  {
    title: '5. User Taskings',
    body: 'We are a platform helping people out there who cannot invest their time in doing the task and still want to earn extra income. We perform tasks on behalf of our User. The tasks performing needs good accuracy and a lot of time, so our team performing the user\'s task will keep a certain amount as a reward for their hard work.',
  },
  {
    title: '6. Payments / Payout',
    body: 'The user will receive the payment shown on the project as the tasks available on the user\'s dashboard are completed by us. We charge a certain amount in % as our commission on tasking. Though there won\'t be any cut-off below the payrate shown on dashboard. (If payrate is shown as $10 per hour, the user will receive the $10 per hour rate. The payrates shown are already after cutting our commission.)',
  },
]

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  // OTP step state
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  // ── Form submit: send OTP ──────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to continue.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await sendOtp(name, email, password)
      setStep('otp')
      startResendCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email')
    } finally {
      setSubmitting(false)
    }
  }

  // ── OTP box input handling ─────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[index] = digit
    setOtpDigits(next)
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otpDigits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtpDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const otp = otpDigits.join('')
    if (otp.length < 6) {
      setError('Please enter all 6 digits')
      return
    }
    setError('')
    setVerifying(true)
    try {
      const user = await verifyOtp(email, otp)
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    setError('')
    try {
      await sendOtp(name, email, password)
      setOtpDigits(['', '', '', '', '', ''])
      startResendCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  // ── OTP Step UI ────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h2>Verify your email</h2>
          <p className={styles.subtitle}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <form onSubmit={handleVerifyOtp}>
            <div className={styles.otpBoxRow} onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  className={styles.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            {error && <p className={styles.errorText}>{error}</p>}
          </form>

          <p className={styles.otpResendRow}>
            Didn't receive the code?{' '}
            <span
              className={resendCooldown > 0 ? styles.resendDisabled : styles.resendLink}
              onClick={handleResend}
            >
              {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </span>
          </p>

          <p className={styles.switchText}>
            <span className={styles.termsLink} onClick={() => { setStep('form'); setError('') }}>
              ← Back to sign up
            </span>
          </p>
        </div>
      </div>
    )
  }

  // ── Form Step UI ───────────────────────────────────────────────────────────
  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h2>Create Account</h2>
        <p className={styles.subtitle}>Get started with RemNext today</p>
        <form onSubmit={handleFormSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
          <label>Confirm Password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirmPassword(v => !v)}>
              {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>

          <div className={styles.termsRow}>
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className={styles.termsCheckbox}
            />
            <label htmlFor="terms" className={styles.termsLabel}>
              I agree to the{' '}
              <span className={styles.termsLink} onClick={() => setShowTerms(true)}>
                Terms & Conditions
              </span>
            </label>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting || !termsAccepted}>
            {submitting ? 'Sending verification code...' : 'Continue'}
          </button>
          {error && <p className={styles.errorText}>{error}</p>}
        </form>
        <div className={styles.divider}><span>or</span></div>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={() => { window.location.href = 'http://localhost:4000/api/auth/google' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className={styles.modalOverlay} onClick={() => setShowTerms(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Terms & Conditions</h3>
              <button className={styles.modalClose} onClick={() => setShowTerms(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalIntro}>
                We are a platform helping people out there who can't invest their time in doing
                the task and still want to earn extra income. The User can earn money by just
                creating accounts through our website. Task performing will be done by our team.
              </p>
              {TERMS_CONTENT.map((section) => (
                <div key={section.title} className={styles.termsSection}>
                  <h4>{section.title}</h4>
                  <p>{section.body}</p>
                </div>
              ))}
              <p className={styles.termsFootnote}>
                The User should review all the information above. When reviewed, we assume that
                the user agrees with the Terms and Conditions.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalAcceptBtn}
                onClick={() => { setTermsAccepted(true); setShowTerms(false) }}
              >
                I Accept
              </button>
              <button className={styles.modalDeclineBtn} onClick={() => setShowTerms(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Signup
