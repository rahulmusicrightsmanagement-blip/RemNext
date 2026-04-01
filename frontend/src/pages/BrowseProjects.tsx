import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import styles from '../styles/Dashboard.module.css'
import authStyles from '../styles/Auth.module.css'

interface Task {
  id: string
  name: string
  description: string | null
  country?: string
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

const TERMS_CONTENT = [
  {
    title: '1. User Registration & Onboarding',
    body: 'User Verification is not must when registering for our website. Once the User has registered on the platform after doing the email authentication, before successfully applying for any project the user will be asked to do a quick Verification using his/her documents.',
  },
  {
    title: '2. Job Matching',
    body: 'The user will get matched to a job when they successfully completed the onboarding and did the verification well. In some Jobs it might take time due to unavailability of tasks. Some tasks may require video exams which should be solved by the user.',
  },
  {
    title: '3. Compliance',
    body: 'The user can opt-out from applying their application or if they want to delete their profile permanently. The user should initiate a request on the helpdesk mail: remnxthepl@gmail.com. Once initiated, the request the user\'s account and all his legal documents will be deleted from our end after the upcoming payout dates (might take 2–3 days in case of any public holidays).',
  },
  {
    title: '4. Regulations',
    body: 'The projects we get are contract based. Once the contract is over the project will not be visible on the dashboard. The User should know that these projects can also be available on other platforms. Since the project goes from a single company to every other platform, and the user has already registered for the particular project on a different platform, they might not get hired here. Repeat applications or use of fake documents will result in permanent suspension of account.',
  },
  {
    title: '5. User Taskings',
    body: 'We are a platform helping people out there who cannot invest their time in doing the task and still want to earn extra income. We perform tasks on behalf of our User. The tasks performing needs good accuracy and a lot of time, so our team performing the user\'s task will keep a certain amount as a reward for their hard work.',
  },
  {
    title: '6. Payments / Payout',
    body: 'The user will receive the payment shown on the project as the tasks available on the user\'s dashboard are completed by us. We charge a certain amount in % as our commission on tasking. Though there won\'t be any cut-off below the payrate shown on dashboard. (If payrate is shown as $10 per hour, the user will receive the $10 per hour rate. The payrates shown are already after cutting our commission.)',
  },
]

function BrowseProjects() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [applyError, setApplyError] = useState('')

  // T&C state
  const [tncTaskId, setTncTaskId] = useState<string | null>(null) // task pending T&C acceptance
  const [tncAccepted, setTncAccepted] = useState(false)

  useEffect(() => {
    Promise.all([
      api<{ tasks: Task[] }>('/tasks/browse', { token: token! }),
      api<{ applications: MyApplication[] }>('/applications/my-applications', { token: token! }),
      api<{ profile: { isComplete?: boolean } | null }>('/profile', { token: token! }),
    ])
      .then(([taskData, appData, profileData]) => {
        setTasks(taskData.tasks)
        setMyApplications(appData.applications)
        setProfileComplete(!!profileData.profile?.isComplete)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  // Block page if profile not complete
  if (!loading && profileComplete === false) {
    return (
      <div className={styles.page}>
        <div className={styles.lockedSection}>
          <span style={{ fontSize: 48 }}>🔒</span>
          <p className={styles.lockedTitle}>Projects are locked</p>
          <p className={styles.lockedSub}>
            You need to complete your profile before you can browse and apply to projects.
          </p>
          <button className={styles.cardBtn} onClick={() => navigate('/user/profile')} style={{ marginTop: 12 }}>
            Complete Profile →
          </button>
          <button
            onClick={() => navigate('/user/dashboard')}
            style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const getAppStatus = (taskId: string) => {
    return myApplications.find(a => a.taskId === taskId)?.status ?? null
  }

  const isFull = (task: Task) => task._count.applications >= task.maxRegistrations

  // Step 1: show T&C modal
  const requestApply = (taskId: string) => {
    setTncTaskId(taskId)
    setTncAccepted(false)
    setApplyError('')
  }

  // Step 2: user accepted T&C, now submit
  const handleAcceptAndApply = async () => {
    if (!tncTaskId) return
    const taskId = tncTaskId
    setTncTaskId(null)
    setApplyingId(taskId)
    setApplyError('')
    try {
      await api('/applications/' + taskId, { method: 'POST', token: token! })
      setMyApplications(prev => [...prev, { taskId, status: 'PENDING' }])
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
        onClick={() => requestApply(task.id)}
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

      {/* ── T&C Modal (before applying) ── */}
      {tncTaskId && (
        <div className={authStyles.modalOverlay} onClick={() => setTncTaskId(null)}>
          <div className={authStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={authStyles.modalHeader}>
              <h3>Terms & Conditions</h3>
              <button className={authStyles.modalClose} onClick={() => setTncTaskId(null)}>✕</button>
            </div>
            <div className={authStyles.modalBody}>
              <p className={authStyles.modalIntro}>
                By applying for this project, you agree to the following terms. Please read carefully before proceeding.
              </p>
              {TERMS_CONTENT.map((section) => (
                <div key={section.title} className={authStyles.termsSection}>
                  <h4>{section.title}</h4>
                  <p>{section.body}</p>
                </div>
              ))}
              <p className={authStyles.termsFootnote}>
                Clicking "I Accept & Apply" confirms you have read and agreed to all terms above.
              </p>

              {/* Checkbox */}
              <div className={authStyles.termsRow} style={{ marginTop: 12 }}>
                <input
                  type="checkbox"
                  id="tnc-apply"
                  checked={tncAccepted}
                  onChange={e => setTncAccepted(e.target.checked)}
                  className={authStyles.termsCheckbox}
                />
                <label htmlFor="tnc-apply" className={authStyles.termsLabel}>
                  I have read and agree to the Terms & Conditions
                </label>
              </div>
            </div>
            <div className={authStyles.modalFooter}>
              <button
                className={authStyles.modalAcceptBtn}
                onClick={handleAcceptAndApply}
                disabled={!tncAccepted}
                style={{ opacity: tncAccepted ? 1 : 0.45, cursor: tncAccepted ? 'pointer' : 'not-allowed' }}
              >
                I Accept & Apply
              </button>
              <button className={authStyles.modalDeclineBtn} onClick={() => setTncTaskId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task Detail Modal ── */}
      {viewTask && (
        <div className={styles.modalOverlay} onClick={() => setViewTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{viewTask.name}</h2>
              <button className={styles.modalClose} onClick={() => setViewTask(null)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalPayRow}>
                <span className={styles.modalPayLabel}>You'll Earn</span>
                <span className={styles.modalPayValue}>${viewTask.userPayment.toFixed(2)}</span>
              </div>

              {viewTask.description && (
                <div className={styles.modalSection}>
                  <p className={styles.modalSectionTitle}>Description</p>
                  <p className={styles.modalText}>{viewTask.description}</p>
                </div>
              )}

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
                {viewTask.country && (
                  <div className={styles.modalDetail} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.modalDetailLabel}>Countries</span>
                    <span className={styles.modalDetailValue}>
                      {viewTask.country.split(',').map(c => c.trim()).filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(() => {
              const status = getAppStatus(viewTask.id)
              if (status === 'PENDING' || status === 'APPROVED') {
                return (
                  <div className={styles.verifyInfoBanner}>
                    <span className={styles.verifyInfoIcon}>✉</span>
                    <div>
                      <p className={styles.verifyInfoTitle}>Verification links will be sent to your email</p>
                      <p className={styles.verifyInfoSub}>
                        If this project requires additional verification, our team will send the link(s) directly to{' '}
                        <strong>{user?.email}</strong>. Please check your inbox (and spam folder).
                      </p>
                    </div>
                  </div>
                )
              }
              return null
            })()}

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

      {applyError && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 16 }}>{applyError}</p>}

      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📭</p>
          <p className={styles.emptyText}>No projects available for your region right now.</p>
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
