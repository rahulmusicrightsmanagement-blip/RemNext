import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Dashboard.module.css'

const statCards = [
  { label: 'Applications Sent', value: '0' },
  { label: 'Active Projects', value: '0' },
  { label: 'Total Earned', value: '$0.00' },
]

function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Welcome back, {user?.name} 👋</h1>
          <p className={styles.subheading}>Here's what's happening with your account today.</p>
        </div>
        <span className={styles.roleBadge}>Freelancer</span>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {statCards.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statValue}>{s.value}</p>
            <p className={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className={styles.sectionTitle}>Quick Actions</h2>
      <div className={styles.cardGrid}>
        <div className={styles.actionCard}>
          <h3>Browse Projects</h3>
          <p>Find new opportunities matching your skills.</p>
          <button className={styles.cardBtn}>Go →</button>
        </div>
        <div className={styles.actionCard}>
          <h3>Complete Profile</h3>
          <p>Verify your documents to unlock all projects.</p>
          <button className={styles.cardBtn} onClick={() => navigate('/user/profile')}>Go →</button>
        </div>
        <div className={styles.actionCard}>
          <h3>View Payouts</h3>
          <p>Track your earnings and upcoming payments.</p>
          <button className={styles.cardBtn}>Go →</button>
        </div>
      </div>

      {/* Active Projects */}
      <h2 className={styles.sectionTitle}>My Projects</h2>
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon}>📂</p>
        <p className={styles.emptyText}>No active projects yet.</p>
        <p className={styles.emptySubtext}>Once you're matched to a project, it will appear here.</p>
      </div>

    </div>
  )
}

export default UserDashboard
