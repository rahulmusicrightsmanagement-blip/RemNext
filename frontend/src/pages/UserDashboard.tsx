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

interface ApprovedProject {
  id: string
  taskId: string
  status: string
  totalHours: number
  taskProgress: string
  createdAt: string
  hoursLogs: HoursLog[]
  task: {
    id: string
    name: string
    description: string | null
    userPayment: number
    deadline: string
    docLinks: string[]
  }
}

interface MyApplication {
  taskId: string
  status: string
}

interface Profile {
  phone?: string
  street?: string; city?: string; state?: string; country?: string; zipCode?: string
  resumeUrl?: string
  paypalEmail?: string; airtmEmail?: string
  isComplete?: boolean
}

function calcProgress(p: Profile | null): { pct: number; done: number; total: number } {
  if (!p) return { pct: 0, done: 0, total: 4 }
  const checks = [
    !!p.phone,
    !!(p.street && p.city && p.state && p.country && p.zipCode),
    !!p.resumeUrl,
    !!(p.paypalEmail || p.airtmEmail),
  ]
  const done = checks.filter(Boolean).length
  return { pct: Math.round((done / 4) * 100), done, total: 4 }
}

function UserDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ApprovedProject[]>([])
  const [myApps, setMyApps] = useState<MyApplication[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoursModal, setHoursModal] = useState<ApprovedProject | null>(null)

  useEffect(() => {
    if (!token) return
    Promise.all([
      api<{ projects: ApprovedProject[] }>('/applications/my-projects', { token }),
      api<{ applications: MyApplication[] }>('/applications/my-applications', { token }),
      api<{ profile: Profile | null }>('/profile', { token }),
    ])
      .then(([projData, appData, profileData]) => {
        setProjects(projData.projects)
        setMyApps(appData.applications)
        setProfile(profileData.profile)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const profileComplete = !!profile?.isComplete
  const { pct, done, total } = calcProgress(profile)

  const totalSent = myApps.length
  const activeCount = projects.length
  const totalEarned = projects.reduce((sum, p) => sum + (p.totalHours ?? 0) * p.task.userPayment, 0)

  const statCards = [
    { label: 'Applications Sent', value: String(totalSent) },
    { label: 'Active Projects', value: String(activeCount) },
    { label: 'Total Earned', value: `$${totalEarned.toFixed(2)}` },
  ]

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

      {/* Profile incomplete banner */}
      {!profileComplete && !loading && (
        <div className={styles.profileBanner}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerIcon}>🔒</span>
            <div>
              <p className={styles.bannerTitle}>Complete your profile to unlock projects</p>
              <p className={styles.bannerSub}>{done} of {total} sections filled — tasks and browsing are locked until your profile is 100% complete.</p>
            </div>
          </div>
          <button className={styles.bannerBtn} onClick={() => navigate('/user/profile')}>
            Complete Now →
          </button>
        </div>
      )}

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

        {/* Browse Projects — locked until profile complete */}
        <div className={`${styles.actionCard} ${!profileComplete ? styles.actionCardLocked : ''}`}>
          {!profileComplete && <span className={styles.lockBadge}>🔒 Locked</span>}
          <h3>Browse Projects</h3>
          <p>Find new opportunities matching your skills.</p>
          {profileComplete
            ? <button className={styles.cardBtn} onClick={() => navigate('/user/projects')}>Go →</button>
            : <span className={styles.lockedHint}>Complete your profile to unlock</span>
          }
        </div>

        {/* Complete Profile — with progress bar */}
        <div className={styles.actionCard}>
          <div className={styles.profileCardTop}>
            <h3>Complete Profile</h3>
            <span className={styles.progressLabel}>{pct}%</span>
          </div>
          <p>{profileComplete ? 'Your profile is fully verified.' : 'Verify your documents to unlock all projects.'}</p>

          {/* Progress bar */}
          <div className={styles.progressBarWrap}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${pct}%`, background: pct === 100 ? '#43a047' : undefined }}
            />
          </div>
          <p className={styles.progressSections}>{done}/{total} sections complete</p>

          <button className={styles.cardBtn} onClick={() => navigate('/user/profile')}>
            {profileComplete ? 'View Profile →' : 'Continue →'}
          </button>
        </div>

        {/* View Payouts */}
        <div className={styles.actionCard}>
          <h3>View Payouts</h3>
          <p>Track your earnings and upcoming payments.</p>
          <button className={styles.cardBtn} onClick={() => navigate('/user/payouts')}>Go →</button>
        </div>
      </div>

      {/* My Projects */}
      <h2 className={styles.sectionTitle}>My Projects</h2>
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading projects...</p>
      ) : !profileComplete ? (
        <div className={styles.lockedSection}>
          <span style={{ fontSize: 36 }}>🔒</span>
          <p className={styles.lockedTitle}>Projects are locked</p>
          <p className={styles.lockedSub}>Complete your profile to start applying and viewing your projects.</p>
          <button className={styles.cardBtn} onClick={() => navigate('/user/profile')} style={{ marginTop: 8 }}>
            Complete Profile →
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📂</p>
          <p className={styles.emptyText}>No active projects yet.</p>
          <p className={styles.emptySubtext}>Once you're approved for a project, it will appear here.</p>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {projects.map(p => {
            const logs = p.hoursLogs ?? []
            return (
              <div key={p.id} className={styles.projectCard}>
                <div className={styles.projectHeader}>
                  <h3 className={styles.projectName}>{p.task.name}</h3>
                  <span className={styles.projectPay}>${p.task.userPayment.toFixed(2)}/hr</span>
                </div>
                {p.task.description && (
                  <p className={styles.projectDesc}>{p.task.description}</p>
                )}
                <div className={styles.projectMeta}>
                  <span>📅 {new Date(p.task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: p.taskProgress === 'COMPLETED' ? 'rgba(74,222,128,0.15)' : p.taskProgress === 'IN_PROGRESS' ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)',
                    color: p.taskProgress === 'COMPLETED' ? '#4ade80' : p.taskProgress === 'IN_PROGRESS' ? '#60a5fa' : '#fbbf24',
                  }}>
                    {p.taskProgress === 'COMPLETED' ? 'Completed' : p.taskProgress === 'IN_PROGRESS' ? 'In Progress' : 'Just Started'}
                  </span>
                </div>
                <div className={styles.projectMeta} style={{ marginTop: 4 }}>
                  <span>⏱ Hours Logged: <strong>{p.totalHours ?? 0}</strong></span>
                </div>
                {p.task.docLinks.length > 0 && (
                  <div className={styles.projectLinks}>
                    {p.task.docLinks.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                        📎 Doc {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {logs.length > 0 && (
                  <button
                    type="button"
                    className={styles.cardBtn}
                    style={{ marginTop: 10, fontSize: 12 }}
                    onClick={() => setHoursModal(p)}
                  >
                    View Hours
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hours Log Modal */}
      {hoursModal && (() => {
        const logs = hoursModal.hoursLogs ?? []
        const totalH = logs.reduce((s, l) => s + l.hours, 0)
        const payrate = hoursModal.task.userPayment
        return (
          <div className={adminStyles.overlay} onClick={() => setHoursModal(null)}>
            <div className={adminStyles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
              <div className={adminStyles.modalHeader}>
                <h3>Hours Log — {hoursModal.task.name}</h3>
                <button className={adminStyles.closeBtn} onClick={() => setHoursModal(null)}>✕</button>
              </div>
              <div className={adminStyles.modalBody}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Total hours: <strong>{totalH.toFixed(2)}h</strong> — Total earned: <strong>${(totalH * payrate).toFixed(2)}</strong>
                </p>
                <div className={styles.hoursTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>Payrate (USD)</th>
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
                <button className={adminStyles.closeOutlineBtn} onClick={() => setHoursModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

export default UserDashboard
