import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Dashboard.module.css'

const statCards = [
  { label: 'Total Users', value: '—' },
  { label: 'Active Tasks', value: '—' },
  { label: 'Platform Revenue', value: '$—' },
]

const adminActions = [
  { label: 'Manage Users', desc: 'View, verify, or change roles of user accounts.', path: '/admin/users' },
  { label: 'Task Management', desc: 'Create and manage tasks assigned to freelancers.', path: '/admin/tasks' },
  { label: 'Payout Queue', desc: 'Review and approve pending payouts.', path: '#' },
]

function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Admin Panel</h1>
          <p className={styles.subheading}>Logged in as <strong>{user?.name}</strong> — {user?.email}</p>
        </div>
        <span className={`${styles.roleBadge} ${styles.adminBadge}`}>Admin</span>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statValue}>{s.value}</p>
            <p className={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Admin Actions</h2>
      <div className={styles.cardGrid}>
        {adminActions.map((a) => (
          <div key={a.label} className={styles.actionCard}>
            <h3>{a.label}</h3>
            <p>{a.desc}</p>
            <button className={styles.cardBtn} onClick={() => navigate(a.path)}>
              Manage →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard
