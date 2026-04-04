import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import styles from '../styles/Dashboard.module.css'

interface ManagerOverview {
  id: string
  name: string
  email: string
  assignedCount: number
  users: { id: string; name: string; email: string; taskName: string; status: string }[]
}

const adminActions = [
  { label: 'Manage Users', desc: 'View, verify, or change roles of user accounts.', path: '/admin/users' },
  { label: 'Task Management', desc: 'Create and manage tasks assigned to freelancers.', path: '/admin/tasks' },
  { label: 'Payout Queue', desc: 'Review and approve pending payouts.', path: '/admin/payouts' },
]

function AdminDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalUsers: '—', activeTasks: '—', totalManagers: '—' })
  const [managers, setManagers] = useState<ManagerOverview[]>([])
  const [expandedMgr, setExpandedMgr] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    // Fetch user count
    api<{ users: { id: string }[] }>('/auth/users', { token })
      .then(d => setStats(prev => ({ ...prev, totalUsers: String(d.users.length) })))
      .catch(() => {})
    // Fetch task count
    api<{ tasks: { id: string }[] }>('/tasks', { token })
      .then(d => setStats(prev => ({ ...prev, activeTasks: String(d.tasks.length) })))
      .catch(() => {})
    // Fetch managers overview
    api<{ managers: ManagerOverview[] }>('/applications/managers-overview', { token })
      .then(d => {
        setManagers(d.managers)
        setStats(prev => ({ ...prev, totalManagers: String(d.managers.length) }))
      })
      .catch(() => {})
  }, [token])

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
        <div className={styles.statCard}>
          <p className={styles.statValue}>{stats.totalUsers}</p>
          <p className={styles.statLabel}>Total Users</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{stats.activeTasks}</p>
          <p className={styles.statLabel}>Active Tasks</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{stats.totalManagers}</p>
          <p className={styles.statLabel}>Managers</p>
        </div>
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

      {/* Manager Tracking Section */}
      <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Manager Tracking</h2>
      {managers.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}>No managers assigned yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {managers.map(mgr => (
            <div key={mgr.id} className={styles.actionCard} style={{ cursor: 'pointer' }} onClick={() => setExpandedMgr(expandedMgr === mgr.id ? null : mgr.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{mgr.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{mgr.email}</p>
                </div>
                <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {mgr.assignedCount} project{mgr.assignedCount !== 1 ? 's' : ''}
                </span>
              </div>
              {expandedMgr === mgr.id && mgr.users.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '4px 8px' }}>User</th>
                        <th style={{ padding: '4px 8px' }}>Email</th>
                        <th style={{ padding: '4px 8px' }}>Project</th>
                        <th style={{ padding: '4px 8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mgr.users.map(u => (
                        <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '6px 8px' }}>{u.name}</td>
                          <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '6px 8px' }}>{u.taskName}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                              background: u.status === 'APPROVED' ? 'rgba(74,222,128,0.15)' : u.status === 'REJECTED' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                              color: u.status === 'APPROVED' ? '#4ade80' : u.status === 'REJECTED' ? '#f87171' : '#fbbf24',
                            }}>
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
