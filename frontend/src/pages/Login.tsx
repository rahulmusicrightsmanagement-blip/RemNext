import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Auth.module.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <h2>Welcome Back</h2>
        <p className={styles.subtitle}>Sign in to your RemNext account</p>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.submitBtn}>Login</button>
        </form>
        <p className={styles.switchText}>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
