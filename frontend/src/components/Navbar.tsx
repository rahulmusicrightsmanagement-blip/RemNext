import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        RemNext
      </Link>
      <Link to="/login" className={styles.loginBtn}>
        Login
      </Link>
    </nav>
  )
}

export default Navbar
