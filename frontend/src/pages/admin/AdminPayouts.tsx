import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import styles from '../../styles/Dashboard.module.css'
import adminStyles from '../../styles/AdminPages.module.css'

interface HoursLog {
  id: string
  hours: number
  note: string | null
  paymentStatus: string
  createdAt: string
}

interface PayoutProject {
  id: string
  totalHours: number
  taskProgress: string
  user: { id: string; name: string; email: string }
  task: {
    id: string
    name: string
    description: string | null
    userPayment: number
    fullPayment: number
    deadline: string
  }
  hoursLogs: HoursLog[]
}

function AdminPayouts() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<PayoutProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<PayoutProject | null>(null)
  const [filterTask, setFilterTask] = useState('')

  useEffect(() => {
    if (!token) return
    api<{ projects: PayoutProject[] }>('/applications/all-payouts', { token })
      .then(d => setProjects(d.projects))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const taskNames = [...new Set(projects.map(p => p.task.name))]

  const filtered = filterTask
    ? projects.filter(p => p.task.name === filterTask)
    : projects

  const totalUserPay = filtered.reduce((sum, p) => sum + (p.totalHours ?? 0) * p.task.userPayment, 0)
  const totalFullPay = filtered.reduce((sum, p) => sum + (p.totalHours ?? 0) * p.task.fullPayment, 0)
  const totalHours = filtered.reduce((sum, p) => sum + (p.totalHours ?? 0), 0)
  const paidLogs = filtered.flatMap(p => p.hoursLogs.filter(l => l.paymentStatus === 'PAID'))
  const pendingLogs = filtered.flatMap(p => p.hoursLogs.filter(l => l.paymentStatus === 'PENDING'))

  return (
    <div className={styles.page} style={{ maxWidth: 1200 }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>All Payouts</h1>
          <p className={styles.subheading}>Overview of all project hours and payments across freelancers.</p>
        </div>
        <button className={styles.cardBtn} onClick={() => navigate('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className={styles.statCard}>
          <p className={styles.statValue}>${totalFullPay.toFixed(2)}</p>
          <p className={styles.statLabel}>Total Full Pay</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>${totalUserPay.toFixed(2)}</p>
          <p className={styles.statLabel}>Total User Pay</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{totalHours.toFixed(1)}h</p>
          <p className={styles.statLabel}>Total Hours</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{paidLogs.length}/{paidLogs.length + pendingLogs.length}</p>
          <p className={styles.statLabel}>Logs Paid</p>
        </div>
      </div>

      {/* Filter */}
      {taskNames.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <select
            value={filterTask}
            onChange={e => setFilterTask(e.target.value)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-accent)',
              background: 'var(--bg-card)', color: 'var(--text-heading)',
              fontFamily: 'Poppins, sans-serif', fontSize: 13, cursor: 'pointer',
            }}
          >
            <option value="">All Projects</option>
            {taskNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      {/* Projects Table */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>💰</p>
          <p className={styles.emptyText}>No payouts found.</p>
          <p className={styles.emptySubtext}>Approved projects with logged hours will appear here.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Freelancer</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Rate / hr</th>
                <th>User Earned</th>
                <th>Full Pay</th>
                <th>Progress</th>
                <th>Paid / Total Logs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const hrs = p.totalHours ?? 0
                const paid = p.hoursLogs.filter(l => l.paymentStatus === 'PAID').length
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.user.email}</div>
                    </td>
                    <td>{p.task.name}</td>
                    <td>{hrs.toFixed(1)}</td>
                    <td>${p.task.userPayment.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${(hrs * p.task.userPayment).toFixed(2)}</td>
                    <td>${(hrs * p.task.fullPayment).toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: p.taskProgress === 'COMPLETED' ? 'rgba(74,222,128,0.15)' : p.taskProgress === 'IN_PROGRESS' ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)',
                        color: p.taskProgress === 'COMPLETED' ? '#4ade80' : p.taskProgress === 'IN_PROGRESS' ? '#60a5fa' : '#fbbf24',
                      }}>
                        {p.taskProgress === 'COMPLETED' ? 'Completed' : p.taskProgress === 'IN_PROGRESS' ? 'In Progress' : 'Just Started'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: paid === p.hoursLogs.length && p.hoursLogs.length > 0 ? '#4ade80' : '#fbbf24' }}>
                        {paid}/{p.hoursLogs.length}
                      </span>
                    </td>
                    <td>
                      {p.hoursLogs.length > 0 ? (
                        <button
                          className={styles.cardBtn}
                          style={{ fontSize: 11, padding: '4px 12px' }}
                          onClick={() => setSelectedProject(p)}
                        >
                          View Logs
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No logs</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hours Log Modal */}
      {selectedProject && (() => {
        const logs = selectedProject.hoursLogs ?? []
        const totalH = logs.reduce((s, l) => s + l.hours, 0)
        const userRate = selectedProject.task.userPayment
        const fullRate = selectedProject.task.fullPayment
        const paidTotal = logs.filter(l => l.paymentStatus === 'PAID').reduce((s, l) => s + l.hours, 0)
        const pendingTotal = logs.filter(l => l.paymentStatus === 'PENDING').reduce((s, l) => s + l.hours, 0)

        return (
          <div className={adminStyles.overlay} onClick={() => setSelectedProject(null)}>
            <div className={adminStyles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
              <div className={adminStyles.modalHeader}>
                <h3>Hours Log — {selectedProject.task.name} ({selectedProject.user.name})</h3>
                <button className={adminStyles.closeBtn} onClick={() => setSelectedProject(null)}>✕</button>
              </div>
              <div className={adminStyles.modalBody}>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, flexWrap: 'wrap' }}>
                  <span>Total: <strong>{totalH.toFixed(2)}h</strong></span>
                  <span>User pay: <strong>${(totalH * userRate).toFixed(2)}</strong></span>
                  <span>Full pay: <strong>${(totalH * fullRate).toFixed(2)}</strong></span>
                  <span style={{ color: '#4ade80' }}>Paid: <strong>{paidTotal.toFixed(2)}h</strong></span>
                  <span style={{ color: '#fbbf24' }}>Pending: <strong>{pendingTotal.toFixed(2)}h</strong></span>
                </div>
                <div className={styles.hoursTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>User Rate</th>
                        <th>User Total</th>
                        <th>Full Rate</th>
                        <th>Full Total</th>
                        <th>Note</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l, i) => (
                        <tr key={i}>
                          <td>{new Date(l.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                          <td>{l.hours.toFixed(2)}</td>
                          <td>${userRate.toFixed(2)}</td>
                          <td>${(l.hours * userRate).toFixed(2)}</td>
                          <td>${fullRate.toFixed(2)}</td>
                          <td>${(l.hours * fullRate).toFixed(2)}</td>
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

export default AdminPayouts
