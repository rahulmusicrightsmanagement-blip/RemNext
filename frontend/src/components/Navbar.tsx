import { Link, useNavigate } from 'react-router-dom'
import styles from '../styles/Navbar.module.css'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        RemNext
      </Link>
      <div className={styles.navActions}>
        {user ? (
          <>
            <span className={styles.userName}>{user.name}</span>
            <button onClick={handleLogout} className={styles.loginBtn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.loginBtn}>
              Login
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
