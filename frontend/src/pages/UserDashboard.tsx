import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import styles from '../styles/Dashboard.module.css'

interface ApprovedProject {
  id: string
  taskId: string
  status: string
  createdAt: string
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
  documentType?: string; documentValue?: string
  resumeUrl?: string
  bankAccountName?: string; bankAccountNumber?: string; paypalEmail?: string
  isComplete?: boolean
}

function calcProgress(p: Profile | null): { pct: number; done: number; total: number } {
  if (!p) return { pct: 0, done: 0, total: 5 }
  const checks = [
    !!p.phone,
    !!(p.street && p.city && p.state && p.country && p.zipCode),
    !!(p.documentType && p.documentValue),
    !!p.resumeUrl,
    !!((p.bankAccountName && p.bankAccountNumber) || p.paypalEmail),
  ]
  const done = checks.filter(Boolean).length
  return { pct: Math.round((done / 5) * 100), done, total: 5 }
}

function UserDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ApprovedProject[]>([])
  const [myApps, setMyApps] = useState<MyApplication[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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
  const totalEarned = projects.reduce((sum, p) => sum + p.task.userPayment, 0)

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
          <button className={styles.cardBtn}>Go →</button>
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
          {projects.map(p => (
            <div key={p.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectName}>{p.task.name}</h3>
                <span className={styles.projectPay}>${p.task.userPayment.toFixed(2)}</span>
              </div>
              {p.task.description && (
                <p className={styles.projectDesc}>{p.task.description}</p>
              )}
              <div className={styles.projectMeta}>
                <span>📅 {new Date(p.task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span style={{ color: '#43a047' }}>✅ Approved</span>
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
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default UserDashboard
