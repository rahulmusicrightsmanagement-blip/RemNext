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
    title: '1. About RemNXT',
    body: 'RemNXT is an AI-powered task marketplace platform designed to help individuals worldwide earn extra income — without personally investing time in completing tasks. Once a user is registered and verified, our dedicated in-house team performs tasks on the user\'s behalf. The user receives the net payout as displayed on their dashboard. RemNXT is open to users globally, including but not limited to residents of the United States, Russia, the United Kingdom, and other countries, subject to their respective local laws and regulations.',
  },
  {
    title: '2. Eligibility',
    body: 'To register on RemNXT, you must: Be at least 18 years of age (or the legal age of majority in your country). Have a valid email address and access to a mobile or desktop device. Not be barred from using such services under the laws of your country. Provide accurate, genuine, and up-to-date personal information. RemNXT reserves the right to deny access to any user who does not meet the above criteria.',
  },
  {
    title: '3. User Registration & Onboarding',
    body: 'Registration requires a valid email address and successful email authentication. Document verification is not mandatory at the time of registration. Before applying for any project, users must complete a KYC (Know Your Customer) verification by submitting valid government-issued identity documents. Users from outside India may submit internationally accepted documents such as a Passport, National ID, or Driver\'s License. Submission of fake, expired, or tampered documents will result in immediate and permanent account suspension with no right to appeal.',
  },
  {
    title: '4. Job Matching',
    body: 'After successful onboarding and KYC verification, users are matched to available projects based on their profile and location. Some projects may have a waiting period due to limited task availability or high demand. Certain projects may require users to complete a short video-based assessment or quiz as part of the eligibility process. RemNXT does not guarantee that every registered user will be matched to a project immediately.',
  },
  {
    title: '5. Task Execution — How RemNXT Works',
    body: 'Tasks listed on the RemNXT platform are performed exclusively by RemNXT\'s own employed team members. No third-party contractors or external individuals are involved. All tasks are carried out solely by full-time RemNXT employees who are trained, verified, and directly employed by RemNXT. Every employee is bound by a Non-Disclosure Agreement (NDA) and strict internal confidentiality policy. User login credentials are never requested, accessed, stored, or shared with any employee or third party under any circumstance. Tasks are completed entirely through RemNXT\'s own internal systems. Any individual claiming to be from RemNXT and asking for your login credentials should be reported immediately to remnxthepl@gmail.com.',
  },
  {
    title: '5.3 Task Compensation',
    body: 'Tasks require considerable time, skill, and accuracy. As compensation, RemNXT retains a commission percentage from the gross task payment. The payrate shown on the user\'s dashboard is the final net amount the user will receive — our commission has already been deducted before display. Example: If a project shows a payrate of \u20B9500 or $10, the user will receive exactly that amount. No further deductions will be made below the displayed rate.',
  },
  {
    title: '6. Commission-Based Task Structure & Platform Legitimacy',
    body: 'RemNXT is a legitimate, service-based task outsourcing platform. Clients contract RemNXT to complete specific AI-related data tasks such as image annotation, data labeling, content review, and similar work. RemNXT is NOT associated with: Gambling or Games of Chance, Multi-Level Marketing (MLM) or Pyramid Schemes, Passive Income Fraud or Get-Rich-Quick Schemes, or Investment Platforms. Commission typically ranges between 20% – 40% of the gross task value depending on project nature and complexity. The payrate on the dashboard is the final net amount — no hidden charges apply.',
  },
  {
    title: '7. Payments & Payouts',
    body: 'Payouts are processed on a scheduled payout cycle as defined per project. The net payrate displayed is the exact amount the user will receive upon successful task completion. Payments are transferred via the user\'s registered payout method (Bank Transfer, UPI, PayPal, Wise, or other supported methods depending on country). RemNXT is not responsible for delays caused by third-party payment processors, banking systems, or international transfer restrictions. Users are responsible for any taxes, duties, or levies applicable in their home country.',
  },
  {
    title: '8. Refund & Dispute Policy',
    body: 'Since RemNXT performs tasks through its own employees, refunds are not applicable once a task has been assigned and work has commenced. Payout disputes must be raised within 7 days of the scheduled payout date by contacting remnxthepl@gmail.com. Disputes raised after 7 days will not be entertained. RemNXT will investigate all valid disputes and respond within 5–7 business days. RemNXT reserves the right to make the final decision on all disputes.',
  },
  {
    title: '9. Project Availability & Compliance',
    body: 'Projects and tasks on RemNXT are sourced from established third-party AI platforms and task marketplaces, including platforms such as Outlier AI, CrowdGen, Handshake AI, and similar organizations. RemNXT acts as an intermediary platform that aggregates these opportunities. All projects are contract-based. Once a client contract ends, it will be automatically removed from the dashboard. Duplicate or repeat applications for the same project will result in disqualification and may lead to account suspension.',
  },
  {
    title: '10. Intellectual Property',
    body: 'All content, design, branding, software, logos, and materials on RemNXT are the exclusive intellectual property of RemNXT protected under Indian and international IP laws. Users are granted a limited, non-transferable, non-exclusive license to access and use the platform solely for personal income generation. Violation of intellectual property rights will result in immediate account termination and may lead to legal action.',
  },
  {
    title: '11. Privacy Policy',
    body: 'RemNXT collects: Full name, email, phone number, date of birth, government-issued identity documents (for KYC), bank or payment details, device information, IP address, and usage data. RemNXT does not sell your personal data to third parties. Data may be shared with payment processors, KYC partners, and legal authorities only when required. Upon account deletion, all personal data and documents will be permanently deleted after the next scheduled payout date. International users acknowledge that data may be stored and processed in India.',
  },
  {
    title: '12. Limitation of Liability',
    body: 'RemNXT provides its platform and services "as is" without any warranties, express or implied. RemNXT is not liable for any indirect, incidental, consequential, or punitive damages. RemNXT\'s total liability shall not exceed the total amount paid out to that user in the 30 days preceding the claim. RemNXT is not responsible for loss of income due to project unavailability, delays in payment by third-party providers, account suspension from violations, or technical downtime.',
  },
  {
    title: '13. Account Suspension & Termination',
    body: 'RemNXT reserves the right to suspend or permanently terminate a user\'s account without prior notice for: Submission of fake, forged, or invalid documents. Duplicate or fraudulent applications. Violation of any section of these Terms and Conditions. Any activity deemed harmful to the platform, its clients, or other users. Suspended users forfeit any pending payouts if the suspension is due to misconduct.',
  },
  {
    title: '14. Account Deletion & Opt-Out',
    body: 'Users may request permanent deletion of their account at any time by emailing: remnxthepl@gmail.com. Upon receiving the request, RemNXT will process any pending payouts on the next scheduled payout date. The account and all associated documents will be permanently deleted within 2–3 business days after the payout.',
  },
  {
    title: '15. Warranties & Disclaimer',
    body: 'RemNXT does not promise, guarantee, or represent any fixed, minimum, or assured income. Earnings are entirely dependent on: availability of contracted projects, successful completion of tasks, and the applicable commission rate. RemNXT does not warrant that the platform will be available 24/7 without interruption. The platform and all services are provided on an "as is" and "as available" basis.',
  },
  {
    title: '16. Confidentiality',
    body: 'All project-related content, task data, client information, and materials accessed through RemNXT are strictly confidential. Users agree not to disclose, share, reproduce, or distribute any project details to any third party. Any breach will result in immediate and permanent account suspension. RemNXT reserves the right to pursue legal action and claim damages against any user found in breach.',
  },
  {
    title: '17. Modifications to Terms',
    body: 'RemNXT reserves the right to update, modify, or replace these Terms and Conditions at any time. Users will be notified of material changes via email at least 7 days before the changes take effect. Continued use of the platform after changes are effective constitutes acceptance of the revised Terms.',
  },
  {
    title: '18. Contact Us',
    body: 'Email: remnxthepl@gmail.com | Website: www.remnxt.com | Support Hours: Monday – Friday, 10:00 AM – 6:00 PM IST',
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
                <strong>Platform:</strong> RemNXT &nbsp;|&nbsp; <strong>Effective Date:</strong> March 28, 2026 &nbsp;|&nbsp; <strong>Website:</strong> www.remnxt.com<br />
                By registering, accessing, or using the RemNXT platform, you confirm that you have read, understood, and agreed to these Terms and Conditions in full. If you do not agree, please discontinue use of the platform immediately.
              </p>
              {TERMS_CONTENT.map((section) => (
                <div key={section.title} className={authStyles.termsSection}>
                  <h4>{section.title}</h4>
                  <p>{section.body}</p>
                </div>
              ))}
              <p className={authStyles.termsFootnote}>
                By registering on RemNXT and completing the onboarding process, you confirm that you have read, understood, and agreed to all of the above Terms and Conditions.<br />
                &copy; 2026 RemNXT. All Rights Reserved. Platform open to global users.
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
