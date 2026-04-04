import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import styles from '../styles/Dashboard.module.css'
import adminStyles from '../styles/AdminPages.module.css'

interface HoursLog {
  id: string
  hours: number
  note: string | null
  paymentStatus: string
  createdAt: string
}

interface PayoutProject {
  id: string
  taskId: string
  status: string
  totalHours: number
  taskProgress: string
  hoursLogs: HoursLog[]
  task: {
    id: string
    name: string
    description: string | null
    userPayment: number
    deadline: string
  }
}

function UserPayouts() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<PayoutProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<PayoutProject | null>(null)

  useEffect(() => {
    if (!token) return
    api<{ projects: PayoutProject[] }>('/applications/my-projects', { token })
      .then(d => setProjects(d.projects))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const totalEarned = projects.reduce((sum, p) => sum + (p.totalHours ?? 0) * p.task.userPayment, 0)
  const totalHours = projects.reduce((sum, p) => sum + (p.totalHours ?? 0), 0)
  const paidHours = projects.reduce((sum, p) =>
    sum + p.hoursLogs.filter(l => l.paymentStatus === 'PAID').reduce((s, l) => s + l.hours, 0), 0)
  const pendingHours = totalHours - paidHours

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>My Payouts</h1>
          <p className={styles.subheading}>Track your earnings and payment status across all projects.</p>
        </div>
        <button className={styles.cardBtn} onClick={() => navigate('/user/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statValue}>${totalEarned.toFixed(2)}</p>
          <p className={styles.statLabel}>Total Earned</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{totalHours.toFixed(1)}h</p>
          <p className={styles.statLabel}>Total Hours</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{pendingHours.toFixed(1)}h</p>
          <p className={styles.statLabel}>Pending Payment</p>
        </div>
      </div>

      {/* Projects List */}
      <h2 className={styles.sectionTitle}>Projects</h2>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>💰</p>
          <p className={styles.emptyText}>No payouts yet.</p>
          <p className={styles.emptySubtext}>Once you're approved for a project and hours are logged, they'll appear here.</p>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {projects.map(p => {
            const logs = p.hoursLogs ?? []
            const earned = (p.totalHours ?? 0) * p.task.userPayment
            const paidCount = logs.filter(l => l.paymentStatus === 'PAID').length
            const pendingCount = logs.filter(l => l.paymentStatus === 'PENDING').length

            return (
              <div key={p.id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{p.task.name}</h3>
                  <span className={styles.projectPay}>${p.task.userPayment.toFixed(2)}/hr</span>
                </div>

                <div className={styles.projectMeta}>
                  <span>Hours: <strong>{(p.totalHours ?? 0).toFixed(1)}</strong></span>
                  <span>Earned: <strong>${earned.toFixed(2)}</strong></span>
                </div>

                <div className={styles.projectMeta}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: p.taskProgress === 'COMPLETED' ? 'rgba(74,222,128,0.15)' : p.taskProgress === 'IN_PROGRESS' ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)',
                    color: p.taskProgress === 'COMPLETED' ? '#4ade80' : p.taskProgress === 'IN_PROGRESS' ? '#60a5fa' : '#fbbf24',
                  }}>
                    {p.taskProgress === 'COMPLETED' ? 'Completed' : p.taskProgress === 'IN_PROGRESS' ? 'In Progress' : 'Just Started'}
                  </span>
                  {paidCount > 0 && (
                    <span style={{ fontSize: 12, color: '#4ade80' }}>{paidCount} paid</span>
                  )}
                  {pendingCount > 0 && (
                    <span style={{ fontSize: 12, color: '#fbbf24' }}>{pendingCount} pending</span>
                  )}
                </div>

                {logs.length > 0 && (
                  <button
                    className={styles.cardBtn}
                    style={{ marginTop: 8, fontSize: 12 }}
                    onClick={() => setSelectedProject(p)}
                  >
                    View Hours Log
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hours Log Modal */}
      {selectedProject && (() => {
        const logs = selectedProject.hoursLogs ?? []
        const totalH = logs.reduce((s, l) => s + l.hours, 0)
        const payrate = selectedProject.task.userPayment
        const paidTotal = logs.filter(l => l.paymentStatus === 'PAID').reduce((s, l) => s + l.hours, 0) * payrate
        const pendingTotal = logs.filter(l => l.paymentStatus === 'PENDING').reduce((s, l) => s + l.hours, 0) * payrate

        return (
          <div className={adminStyles.overlay} onClick={() => setSelectedProject(null)}>
            <div className={adminStyles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
              <div className={adminStyles.modalHeader}>
                <h3>Hours Log — {selectedProject.task.name}</h3>
                <button className={adminStyles.closeBtn} onClick={() => setSelectedProject(null)}>✕</button>
              </div>
              <div className={adminStyles.modalBody}>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span>Total: <strong>{totalH.toFixed(2)}h</strong> — <strong>${(totalH * payrate).toFixed(2)}</strong></span>
                  <span style={{ color: '#4ade80' }}>Paid: <strong>${paidTotal.toFixed(2)}</strong></span>
                  <span style={{ color: '#fbbf24' }}>Pending: <strong>${pendingTotal.toFixed(2)}</strong></span>
                </div>
                <div className={styles.hoursTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>Rate (USD)</th>
                        <th>Total (USD)</th>
                        <th>Note</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l, i) => (
                        <tr key={i}>
                          <td>{new Date(l.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          <td>{l.hours.toFixed(2)}</td>
                          <td>${payrate.toFixed(2)}</td>
                          <td>${(l.hours * payrate).toFixed(2)}</td>
                          <td>{l.note || '—'}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                              background: l.paymentStatus === 'PAID' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                              color: l.paymentStatus === 'PAID' ? '#4ade80' : '#fbbf24',
                            }}>{l.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={adminStyles.modalFooter}>
                <button className={adminStyles.closeOutlineBtn} onClick={() => setSelectedProject(null)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default UserPayouts
