import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/Auth.module.css'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const role = params.get('role')
    const error = params.get('error')

    if (error || !token) {
      navigate('/login?error=oauth_failed')
      return
    }

    // Store token then do a full reload so AuthContext reinitializes from sessionStorage
    sessionStorage.setItem('token', token)
    window.location.replace(role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard')
  }, [])

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard} style={{ textAlign: 'center' }}>
        <p className={styles.subtitle}>Signing you in...</p>
      </div>
    </div>
  )
}

export default AuthCallback
