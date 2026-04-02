import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import styles from '../styles/Navbar.module.css'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'

interface Notification {
  id: string
  message: string
  type: string
  taskId: string | null
  taskName: string | null
  read: boolean
  createdAt: string
}

function Navbar() {
  const { user, token, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  // Fetch unread count on mount + poll every 30s
  const fetchUnreadCount = useCallback(async () => {
    if (!token || !user || user.role === 'ADMIN') return
    try {
      const data = await api<{ count: number }>('/notifications/unread-count', { token })
      setUnreadCount(data.count)
    } catch { /* ignore */ }
  }, [token, user])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const openNotifications = async () => {
    setNotifOpen(o => !o)
    setMenuOpen(false)
    if (!notifOpen && token) {
      try {
        const data = await api<{ notifications: Notification[] }>('/notifications', { token })
        setNotifications(data.notifications)
      } catch { /* ignore */ }
    }
  }

  const markAllRead = async () => {
    if (!token) return
    try {
      await api('/notifications/read-all', { method: 'PUT', token })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const markOneRead = async (id: string) => {
    if (!token) return
    try {
      await api(`/notifications/${id}/read`, { method: 'PUT', token })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (menuOpen || notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, notifOpen])

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        RemNxt
      </Link>
      <div className={styles.navActions}>
        {user ? (
          <>
            {/* Bell icon for notifications (users only) */}
            {user.role !== 'ADMIN' && (
              <div className={styles.notifWrapper} ref={notifRef}>
                <button className={styles.bellBtn} onClick={openNotifications}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>

                {notifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <span>Notifications</span>
                      {notifications.some(n => !n.read) && (
                        <button className={styles.markAllBtn} onClick={markAllRead}>Mark all read</button>
                      )}
                    </div>
                    <div className={styles.notifBody}>
                      {notifications.length === 0 ? (
                        <p className={styles.notifEmpty}>No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                            onClick={() => { if (!n.read) markOneRead(n.id) }}
                          >
                            <span className={styles.notifIcon}>{n.type === 'APPROVED' ? '🎉' : '❌'}</span>
                            <div className={styles.notifContent}>
                              <p className={styles.notifMsg}>{n.message}</p>
                              <p className={styles.notifTime}>
                                {new Date(n.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            {!n.read && <span className={styles.notifDot} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          <div className={styles.userMenu} ref={menuRef}>
            <button
              className={styles.userMenuBtn}
              onClick={() => setMenuOpen(o => !o)}
            >
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className={styles.avatar} />
              ) : (
                <span className={styles.avatarFallback}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className={styles.userName}>{user.name}</span>
              {/* Hamburger icon */}
              <span className={styles.hamburger}>
                <span /><span /><span />
              </span>
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setMenuOpen(false)
                    const dashMap: Record<string, string> = {
                      ADMIN: '/admin/dashboard',
                      MANAGER: '/manager/dashboard',
                      USER: '/user/dashboard',
                    }
                    navigate(dashMap[user.role] || '/user/dashboard')
                  }}
                >
                  Dashboard
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setMenuOpen(false); navigate('/user/profile') }}
                >
                  Edit Profile
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
