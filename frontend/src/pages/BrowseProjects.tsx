import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import styles from '../styles/Dashboard.module.css'

interface Task {
  id: string
  name: string
  description: string | null
  docLinks: string[]
  requiresVerification: boolean
  userPayment: number
  maxRegistrations: number
  deadline: string
  createdAt: string
  _count: { applications: number }
}

interface MyApplication {
  taskId: string
  status: string
}

function BrowseProjects() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    Promise.all([
      api<{ tasks: Task[] }>('/tasks/browse', { token: token! }),
      api<{ applications: MyApplication[] }>('/applications/my-applications', { token: token! }),
    ])
      .then(([taskData, appData]) => {
        setTasks(taskData.tasks)
        setMyApplications(appData.applications)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const getAppStatus = (taskId: string) => {
    return myApplications.find(a => a.taskId === taskId)?.status ?? null
  }

  const isFull = (task: Task) => task._count.applications >= task.maxRegistrations

  const handleApply = async (taskId: string) => {
    setApplyError('')
    setApplyingId(taskId)
    try {
      await api('/applications/' + taskId, { method: 'POST', token: token! })
      setMyApplications(prev => [...prev, { taskId, status: 'PENDING' }])
      // Update the count locally
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, _count: { applications: t._count.applications + 1 } } : t
      ))
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setApplyingId(null)
    }
  }

  const renderApplyButton = (task: Task, inModal = false) => {
    const status = getAppStatus(task.id)
    const full = isFull(task)

    if (status === 'APPROVED') {
      return <button className={styles.applyBtn} disabled style={{ opacity: 0.7, cursor: 'default' }}>✅ Approved</button>
    }
    if (status === 'PENDING') {
      return <button className={styles.applyBtn} disabled style={{ opacity: 0.7, cursor: 'default' }}>⏳ Applied</button>
    }
    if (status === 'REJECTED') {
      return <button className={styles.applyBtn} disabled style={{ opacity: 0.7, cursor: 'default' }}>❌ Rejected</button>
    }
    if (full) {
      return (
        <div style={{ textAlign: 'center', flex: 1 }}>
          <button className={styles.applyBtn} disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}>
            Limit Reached
          </button>
          {inModal && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Max applications reached. Browse other projects.</p>}
        </div>
      )
    }
    return (
      <button
        className={styles.applyBtn}
        onClick={() => handleApply(task.id)}
        disabled={applyingId === task.id}
      >
        {applyingId === task.id ? 'Applying...' : 'Apply Now →'}
      </button>
    )
  }

  const daysLeft = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? `${diff} day${diff > 1 ? 's' : ''} left` : 'Expired'
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  if (loading) return (
    <div className={styles.page}>
      <p style={{ color: '#B0ACB6', textAlign: 'center', paddingTop: 80 }}>Loading projects...</p>
    </div>
  )

  return (
    <div className={styles.page}>

      {/* ── Task Detail Modal ── */}
      {viewTask && (
        <div className={styles.modalOverlay} onClick={() => setViewTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{viewTask.name}</h2>
              <button className={styles.modalClose} onClick={() => setViewTask(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* Payment */}
              <div className={styles.modalPayRow}>
                <span className={styles.modalPayLabel}>You'll Earn</span>
                <span className={styles.modalPayValue}>${viewTask.userPayment.toFixed(2)}</span>
              </div>

              {/* Description */}
              {viewTask.description && (
                <div className={styles.modalSection}>
                  <p className={styles.modalSectionTitle}>Description</p>
                  <p className={styles.modalText}>{viewTask.description}</p>
                </div>
              )}

              {/* Details grid */}
              <div className={styles.modalGrid}>
                <div className={styles.modalDetail}>
                  <span className={styles.modalDetailLabel}>Deadline</span>
                  <span className={styles.modalDetailValue}>{formatDate(viewTask.deadline)} ({daysLeft(viewTask.deadline)})</span>
                </div>
                <div className={styles.modalDetail}>
                  <span className={styles.modalDetailLabel}>Available Spots</span>
                  <span className={styles.modalDetailValue}>{viewTask.maxRegistrations - viewTask._count.applications} / {viewTask.maxRegistrations}</span>
                </div>
                <div className={styles.modalDetail}>
                  <span className={styles.modalDetailLabel}>Verification Required</span>
                  <span className={styles.modalDetailValue}>{viewTask.requiresVerification ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.modalDetail}>
                  <span className={styles.modalDetailLabel}>Posted On</span>
                  <span className={styles.modalDetailValue}>{formatDate(viewTask.createdAt)}</span>
                </div>
              </div>

              {/* Doc links */}
              {viewTask.docLinks.length > 0 && (
                <div className={styles.modalSection}>
                  <p className={styles.modalSectionTitle}>Reference Documents</p>
                  <div className={styles.projectLinks}>
                    {viewTask.docLinks.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                        📎 Document {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {applyError && <p style={{ color: '#c62828', fontSize: 12, marginBottom: 8 }}>{applyError}</p>}
              {renderApplyButton(viewTask, true)}
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <button className={styles.cardBtn} onClick={() => navigate('/user/dashboard')} style={{ marginBottom: 12 }}>
            ← Back to Dashboard
          </button>
          <h1 className={styles.heading}>Browse Projects</h1>
          <p className={styles.subheading}>Find opportunities matching your skills and apply.</p>
        </div>
        <span className={styles.roleBadge}>{tasks.length} Available</span>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📭</p>
          <p className={styles.emptyText}>No projects available right now.</p>
          <p className={styles.emptySubtext}>Check back later — new projects are posted regularly.</p>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {tasks.map(task => (
            <div key={task.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectName}>{task.name}</h3>
                <span className={styles.projectPay}>${task.userPayment.toFixed(2)}</span>
              </div>
              {task.description && (
                <p className={styles.projectDesc}>{task.description}</p>
              )}
              <div className={styles.projectMeta}>
                <span>⏰ {daysLeft(task.deadline)}</span>
                <span>👥 {task.maxRegistrations - task._count.applications} / {task.maxRegistrations} spots</span>
                {task.requiresVerification && <span>✅ Verified only</span>}
              </div>
              <div className={styles.projectActions}>
                <button className={styles.viewBtn} onClick={() => setViewTask(task)}>View</button>
                {renderApplyButton(task)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BrowseProjects
