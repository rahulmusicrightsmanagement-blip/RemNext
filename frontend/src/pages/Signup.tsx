import { useState } from 'react'
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
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SyntheticEvent) => {
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
      const user = await signup(name, email, password)
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h2>Create Account</h2>
        <p className={styles.subtitle}>Get started with RemNext today</p>
        <form onSubmit={handleSubmit}>
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
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
          {error && <p className={styles.errorText}>{error}</p>}
        </form>
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
