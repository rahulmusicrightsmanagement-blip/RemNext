import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import styles from '../styles/Dashboard.module.css'
import adminStyles from '../styles/AdminPages.module.css'

interface ManagerApp {
  id: string
  userId: string
  taskId: string
  status: string
  mailSent: boolean
  verificationLinks: string[]
  user: { id: string; name: string; email: string }
  task: { id: string; name: string; userPayment: number; deadline: string }
}

interface TaskCard {
  id: string
  name: string
  userPayment: number
  deadline: string
  country: string | null
  applicationsCount: number
  approvedCount: number
  pendingMailCount: number
  totalHours: number
}

interface DashboardStats {
  totalApplications: number
  projectsManaged: number
  pendingMailCount: number
  mailSentCount: number
  approvedCount: number
  projects: { id: string; name: string }[]
  taskCards: TaskCard[]
}

interface UserProfile {
  user: { id: string; name: string; email: string; role: string; createdAt: string }
  profile: {
    phoneCode?: string; phone?: string
    street?: string; road?: string; city?: string; state?: string; country?: string; zipCode?: string
    resumeUrl?: string
    bankAccountName?: string; paypalEmail?: string
    profilePhoto?: string
  } | null
}

interface HoursLog {
  id: string
  hours: number
  note: string | null
  createdAt: string
}

function ManagerDashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [applications, setApplications] = useState<ManagerApp[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // Send verification state
  const [selectedApp, setSelectedApp] = useState<ManagerApp | null>(null)
  const [verifyUrls, setVerifyUrls] = useState<string[]>([''])
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState('')
  const [verifyError, setVerifyError] = useState('')

  // User profile modal state
  const [viewUser, setViewUser] = useState<UserProfile | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)

  // Hours logging state
  const [hoursApp, setHoursApp] = useState<ManagerApp | null>(null)
  const [hoursInput, setHoursInput] = useState('')
  const [hoursNote, setHoursNote] = useState('')
  const [loggingHours, setLoggingHours] = useState(false)
  const [hoursLogs, setHoursLogs] = useState<HoursLog[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [hoursSuccess, setHoursSuccess] = useState('')
  const [hoursError, setHoursError] = useState('')

  useEffect(() => {
    if (!token) return
    Promise.all([
      api<DashboardStats>('/manager/dashboard', { token }),
      api<{ applications: ManagerApp[] }>('/manager/applications', { token }),
    ])
      .then(([dashData, appData]) => {
        setStats(dashData)
        setApplications(appData.applications)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const handleSendVerification = async () => {
    if (!selectedApp || !token) return
    const cleanUrls = verifyUrls.filter(u => u.trim())
    if (cleanUrls.length === 0) { setVerifyError('Add at least one URL'); return }

    setSendingVerification(true)
    setVerifyError('')
    setVerifySuccess('')
    try {
      await api(`/manager/applications/${selectedApp.id}/send-verification`, {
        method: 'POST', body: { urls: cleanUrls }, token,
      })
      setVerifySuccess(`Verification email sent to ${selectedApp.user.email}`)
      setApplications(prev => prev.map(a =>
        a.id === selectedApp.id ? { ...a, mailSent: true, verificationLinks: [...a.verificationLinks, ...cleanUrls] } : a
      ))
      setVerifyUrls([''])
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSendingVerification(false)
    }
  }

  const openHoursModal = async (app: ManagerApp) => {
    setHoursApp(app)
    setHoursInput('')
    setHoursNote('')
    setHoursSuccess('')
    setHoursError('')
    if (token) {
      try {
        const data = await api<{ logs: HoursLog[]; totalHours: number }>(`/manager/applications/${app.id}/hours`, { token })
        setHoursLogs(data.logs)
        setTotalHours(data.totalHours)
      } catch { setHoursLogs([]); setTotalHours(0) }
    }
  }

  const handleLogHours = async () => {
    if (!hoursApp || !token) return
    if (!hoursInput || parseFloat(hoursInput) <= 0) { setHoursError('Enter valid hours'); return }

    setLoggingHours(true)
    setHoursError('')
    setHoursSuccess('')
    try {
      const log = await api<{ log: HoursLog }>(`/manager/applications/${hoursApp.id}/hours`, {
        method: 'POST', body: { hours: parseFloat(hoursInput), note: hoursNote || undefined }, token,
      })
      setHoursLogs(prev => [log.log, ...prev])
      setTotalHours(prev => prev + parseFloat(hoursInput))
      setHoursInput('')
      setHoursNote('')
      setHoursSuccess('Hours logged successfully')
    } catch (err) {
      setHoursError(err instanceof Error ? err.message : 'Failed to log hours')
    } finally {
      setLoggingHours(false)
    }
  }

  const openUserProfile = async (userId: string) => {
    if (!token) return
    setLoadingUser(true)
    setViewUser(null)
    try {
      const data = await api<UserProfile>(`/manager/users/${userId}/profile`, { token })
      setViewUser(data)
    } catch { /* ignore */ }
    finally { setLoadingUser(false) }
  }

  const getTaskApps = (taskId: string) => applications.filter(a => a.taskId === taskId)

  if (loading) return (
    <div className={styles.page}>
      <p style={{ color: '#B0ACB6', textAlign: 'center', paddingTop: 80 }}>Loading dashboard...</p>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Manager Panel</h1>
          <p className={styles.subheading}>Logged in as <strong>{user?.name}</strong> — {user?.email}</p>
        </div>
        <span className={styles.roleBadge}>Manager</span>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{stats?.projectsManaged ?? 0}</p>
          <p className={styles.statLabel}>Projects Managed</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{stats?.totalApplications ?? 0}</p>
          <p className={styles.statLabel}>Total Applications</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statValue}>{stats?.pendingMailCount ?? 0}</p>
          <p className={styles.statLabel}>Pending Mail</p>
        </div>
      </div>

      {/* Task Cards */}
      <h2 className={styles.sectionTitle}>Assigned Tasks</h2>
      {!stats?.taskCards?.length ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyText}>No tasks assigned to you yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {stats.taskCards.map(tc => {
            const isExpanded = expandedTask === tc.id
            const taskApps = getTaskApps(tc.id)
            return (
              <div key={tc.id} className={styles.actionCard} style={{ cursor: 'default' }}>
                {/* Card header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{tc.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      📅 {new Date(tc.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {tc.country && ` · 🌍 ${tc.country}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #D59CFA 0%, #58395B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {tc.totalHours.toFixed(1)}h
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Hours</p>
                    </div>
                    <div style={{ width: 1, height: 32, background: 'var(--border-light)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{tc.applicationsCount}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Users</p>
                    </div>
                    <button
                      className={adminStyles.viewBtn}
                      onClick={() => setExpandedTask(isExpanded ? null : tc.id)}
                      style={{ marginLeft: 4 }}
                    >
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {/* Mini stat pills */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 50, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                    {tc.approvedCount} approved
                  </span>
                  {tc.pendingMailCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 50, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                      {tc.pendingMailCount} pending mail
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 50, background: 'rgba(213,156,250,0.12)', border: '1px solid rgba(213,156,250,0.3)', color: 'var(--text-secondary)' }}>
                    ${tc.userPayment} / person
                  </span>
                </div>

                {/* Expanded: user list with actions */}
                {isExpanded && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                    {taskApps.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No applications for this task yet.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            <th style={{ padding: '6px 10px' }}>#</th>
                            <th style={{ padding: '6px 10px' }}>User</th>
                            <th style={{ padding: '6px 10px' }}>Email</th>
                            <th style={{ padding: '6px 10px' }}>Status</th>
                            <th style={{ padding: '6px 10px' }}>Mail</th>
                            <th style={{ padding: '6px 10px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskApps.map((app, i) => (
                            <tr key={app.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline dotted' }}
                                onClick={() => openUserProfile(app.user.id)}>{app.user.name}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 12 }}>{app.user.email}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                  background: app.status === 'APPROVED' ? 'rgba(74,222,128,0.15)' : app.status === 'REJECTED' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                                  color: app.status === 'APPROVED' ? '#4ade80' : app.status === 'REJECTED' ? '#f87171' : '#fbbf24',
                                }}>
                                  {app.status}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {app.mailSent ? (
                                  <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✉ Sent</span>
                                ) : (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {!app.mailSent && app.status === 'PENDING' && (
                                    <button className={adminStyles.viewBtn} style={{ fontSize: 11, padding: '4px 10px' }}
                                      onClick={() => { setSelectedApp(app); setVerifyUrls(['']); setVerifySuccess(''); setVerifyError('') }}>
                                      Send Mail
                                    </button>
                                  )}
                                  {app.mailSent && (
                                    <button className={adminStyles.viewBtn} style={{ fontSize: 11, padding: '4px 10px' }}
                                      onClick={() => { setSelectedApp(app); setVerifyUrls(['']); setVerifySuccess(''); setVerifyError('') }}>
                                      View Links
                                    </button>
                                  )}
                                  {app.status === 'APPROVED' && (
                                    <button className={adminStyles.viewBtn} style={{ fontSize: 11, padding: '4px 10px' }}
                                      onClick={() => openHoursModal(app)}>
                                      Log Hours
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Send Verification Modal */}
      {selectedApp && (
        <div className={adminStyles.overlay} onClick={() => setSelectedApp(null)}>
          <div className={adminStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={adminStyles.modalHeader}>
              <h3>Send Verification — {selectedApp.user.name}</h3>
              <button className={adminStyles.closeBtn} onClick={() => setSelectedApp(null)}>✕</button>
            </div>
            <div className={adminStyles.modalBody}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Project: <strong>{selectedApp.task.name}</strong><br />
                Applicant email: <strong>{selectedApp.user.email}</strong>
              </p>

              {verifyUrls.map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-accent)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-body)' }}
                    placeholder={`Verification URL ${i + 1}`}
                    value={url}
                    onChange={e => {
                      const copy = [...verifyUrls]
                      copy[i] = e.target.value
                      setVerifyUrls(copy)
                    }}
                  />
                  {verifyUrls.length > 1 && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 16 }}
                      onClick={() => setVerifyUrls(verifyUrls.filter((_, j) => j !== i))}
                    >✕</button>
                  )}
                </div>
              ))}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, marginBottom: 8 }}
                onClick={() => setVerifyUrls([...verifyUrls, ''])}
              >+ Add another URL</button>

              {verifyError && <p style={{ color: '#c62828', fontSize: 12, marginTop: 8 }}>{verifyError}</p>}
              {verifySuccess && <p style={{ color: '#43a047', fontSize: 12, marginTop: 8 }}>{verifySuccess}</p>}

              {selectedApp.verificationLinks.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                    Previously Sent Links
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedApp.verificationLinks.map((link, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', borderRadius: 8, padding: '7px 12px' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>#{i + 1}</span>
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: 'var(--color-accent)', textDecoration: 'none', wordBreak: 'break-all', flex: 1 }}
                        >
                          {link}
                        </a>
                        <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600, flexShrink: 0 }}>✉ Sent</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={adminStyles.modalFooter}>
              <button
                className={adminStyles.roleBtn}
                onClick={handleSendVerification}
                disabled={sendingVerification}
              >
                {sendingVerification ? 'Sending...' : 'Send Verification Email'}
              </button>
              <button className={adminStyles.closeOutlineBtn} onClick={() => setSelectedApp(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {(loadingUser || viewUser) && (
        <div className={adminStyles.overlay} onClick={() => { setViewUser(null); setLoadingUser(false) }}>
          <div className={adminStyles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className={adminStyles.modalHeader}>
              <h3>User Profile</h3>
              <button className={adminStyles.closeBtn} onClick={() => { setViewUser(null); setLoadingUser(false) }}>✕</button>
            </div>
            <div className={adminStyles.modalBody}>
              {loadingUser ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Loading...</p>
              ) : viewUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(213,156,250,0.15)', border: '2px solid rgba(213,156,250,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 700, color: 'var(--text-secondary)', overflow: 'hidden',
                    }}>
                      {viewUser.profile?.profilePhoto
                        ? <img src={viewUser.profile.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : viewUser.user.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--text-heading)' }}>{viewUser.user.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{viewUser.user.email}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Joined {new Date(viewUser.user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {viewUser.profile ? (
                    <>
                      {/* Contact */}
                      {viewUser.profile.phone && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '12px 16px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Contact</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-body)' }}>
                            📞 {viewUser.profile.phoneCode} {viewUser.profile.phone}
                          </p>
                        </div>
                      )}

                      {/* Address */}
                      {viewUser.profile.city && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '12px 16px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Address</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>
                            {[viewUser.profile.street, viewUser.profile.road, viewUser.profile.city, viewUser.profile.state, viewUser.profile.zipCode, viewUser.profile.country]
                              .filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Resume */}
                      {viewUser.profile.resumeUrl && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '12px 16px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Resume</p>
                          <a
                            href={viewUser.profile.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            📄 View Resume →
                          </a>
                        </div>
                      )}

                      {/* Payment */}
                      {(viewUser.profile.bankAccountName || viewUser.profile.paypalEmail) && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '12px 16px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Payment</p>
                          {viewUser.profile.bankAccountName && (
                            <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--text-body)' }}>🏦 {viewUser.profile.bankAccountName}</p>
                          )}
                          {viewUser.profile.paypalEmail && (
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-body)' }}>💙 {viewUser.profile.paypalEmail}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                      This user hasn't completed their profile yet.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className={adminStyles.modalFooter}>
              <button className={adminStyles.closeOutlineBtn} onClick={() => { setViewUser(null); setLoadingUser(false) }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Hours Log Modal */}
      {hoursApp && (
        <div className={adminStyles.overlay} onClick={() => setHoursApp(null)}>
          <div className={adminStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={adminStyles.modalHeader}>
              <h3>Log Hours — {hoursApp.user.name}</h3>
              <button className={adminStyles.closeBtn} onClick={() => setHoursApp(null)}>✕</button>
            </div>
            <div className={adminStyles.modalBody}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Project: <strong>{hoursApp.task.name}</strong><br />
                Total hours logged: <strong>{totalHours.toFixed(1)}h</strong>
              </p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="Hours"
                  value={hoursInput}
                  onChange={e => setHoursInput(e.target.value)}
                  style={{ width: 100, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-accent)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-body)' }}
                />
                <input
                  placeholder="Note (optional)"
                  value={hoursNote}
                  onChange={e => setHoursNote(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-accent)', fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-body)' }}
                />
                <button
                  className={adminStyles.roleBtn}
                  onClick={handleLogHours}
                  disabled={loggingHours}
                >
                  {loggingHours ? '...' : 'Add'}
                </button>
              </div>

              {hoursError && <p style={{ color: '#c62828', fontSize: 12 }}>{hoursError}</p>}
              {hoursSuccess && <p style={{ color: '#43a047', fontSize: 12 }}>{hoursSuccess}</p>}

              {hoursLogs.length > 0 && (
                <div style={{ marginTop: 16, maxHeight: 200, overflowY: 'auto' }}>
                  <table className={adminStyles.table} style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoursLogs.map(l => (
                        <tr key={l.id}>
                          <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                          <td>{l.hours.toFixed(1)}h</td>
                          <td>{l.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={adminStyles.modalFooter}>
              <button className={adminStyles.closeOutlineBtn} onClick={() => setHoursApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard
