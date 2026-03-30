import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import styles from '../../styles/AdminPages.module.css'

interface Task {
  id: string
  name: string
  description?: string
  docLinks: string[]
  requiresVerification: boolean
  fullPayment: number
  commission: number
  userPayment: number
  maxRegistrations: number
  maxAssignments: number
  deadline: string
  createdAt: string
}

interface ApplicationUser {
  id: string
  name: string
  email: string
}

interface Application {
  id: string
  userId: string
  taskId: string
  status: string
  createdAt: string
  user: ApplicationUser
}

interface UserProfile {
  profilePhoto: string | null
  phoneCode: string | null
  phone: string | null
  city: string | null
  state: string | null
  country: string | null
  documentType: string | null
  documentFileData: string | null
  resumeUrl: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankRoutingNumber: string | null
  bankSwiftCode: string | null
  paypalEmail: string | null
}

interface AppDetail {
  application: Application & { task: { id: string; name: string } }
  profile: UserProfile | null
}

const emptyForm = {
  name: '',
  description: '',
  docLinks: [''],
  requiresVerification: false,
  fullPayment: '',
  commission: '',
  maxRegistrations: '',
  maxAssignments: '',
  deadline: '',
}

function TaskManagement() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Applications state
  const [appsTaskId, setAppsTaskId] = useState<string | null>(null)
  const [appsTaskName, setAppsTaskName] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [appDetail, setAppDetail] = useState<AppDetail | null>(null)
  const [appDetailLoading, setAppDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [appCounts, setAppCounts] = useState<Record<string, number>>({})

  const userPaymentPreview =
    form.fullPayment && form.commission
      ? (parseFloat(form.fullPayment) * (1 - parseFloat(form.commission) / 100)).toFixed(2)
      : '—'

  const editUserPaymentPreview =
    editForm.fullPayment && editForm.commission
      ? (parseFloat(editForm.fullPayment) * (1 - parseFloat(editForm.commission) / 100)).toFixed(2)
      : '—'

  useEffect(() => {
    api<{ tasks: Task[] }>('/tasks', { token: token! })
      .then(d => {
        setTasks(d.tasks)
        // Fetch app counts for all tasks
        d.tasks.forEach(t => {
          api<{ applications: Application[] }>(`/applications/task/${t.id}`, { token: token! })
            .then(res => setAppCounts(prev => ({ ...prev, [t.id]: res.applications.length })))
            .catch(() => {})
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const addDocLink = () => setForm(f => ({ ...f, docLinks: [...f.docLinks, ''] }))
  const removeDocLink = (i: number) => setForm(f => ({ ...f, docLinks: f.docLinks.filter((_, idx) => idx !== i) }))
  const updateDocLink = (i: number, val: string) =>
    setForm(f => ({ ...f, docLinks: f.docLinks.map((l, idx) => idx === i ? val : l) }))

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.fullPayment || !form.commission) {
      setError('Task name, payment and commission are required.')
      return
    }
    setSubmitting(true)
    try {
      const data = await api<{ task: Task }>('/tasks', {
        method: 'POST',
        token: token!,
        body: {
          name: form.name,
          description: form.description,
          docLinks: form.docLinks,
          requiresVerification: form.requiresVerification,
          fullPayment: form.fullPayment,
          commission: form.commission,
          maxRegistrations: form.maxRegistrations,
          maxAssignments: form.maxAssignments,
          deadline: form.deadline,
        },
      })
      setTasks(prev => [data.task, ...prev])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditTask = (task: Task) => {
    setEditTask(task)
    setEditForm({
      name: task.name,
      description: task.description ?? '',
      docLinks: task.docLinks.length > 0 ? task.docLinks : [''],
      requiresVerification: task.requiresVerification,
      fullPayment: String(task.fullPayment),
      commission: String(task.commission),
      maxRegistrations: String(task.maxRegistrations),
      maxAssignments: String(task.maxAssignments),
      deadline: new Date(task.deadline).toISOString().slice(0, 16),
    })
    setEditError('')
  }

  const addEditDocLink = () => setEditForm(f => ({ ...f, docLinks: [...f.docLinks, ''] }))
  const removeEditDocLink = (i: number) => setEditForm(f => ({ ...f, docLinks: f.docLinks.filter((_, idx) => idx !== i) }))
  const updateEditDocLink = (i: number, val: string) =>
    setEditForm(f => ({ ...f, docLinks: f.docLinks.map((l, idx) => idx === i ? val : l) }))

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!editTask) return
    setEditError('')
    if (!editForm.name || !editForm.fullPayment || !editForm.commission) {
      setEditError('Task name, payment and commission are required.')
      return
    }
    setEditSubmitting(true)
    try {
      const data = await api<{ task: Task }>(`/tasks/${editTask.id}`, {
        method: 'PATCH',
        token: token!,
        body: {
          name: editForm.name,
          description: editForm.description,
          docLinks: editForm.docLinks,
          requiresVerification: editForm.requiresVerification,
          fullPayment: editForm.fullPayment,
          commission: editForm.commission,
          maxRegistrations: editForm.maxRegistrations,
          maxAssignments: editForm.maxAssignments,
          deadline: editForm.deadline,
        },
      })
      setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t))
      setEditTask(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setEditSubmitting(false)
    }
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    setDeletingId(id)
    try {
      await api(`/tasks/${id}`, { method: 'DELETE', token: token! })
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Application handlers ──
  const openApplications = async (task: Task) => {
    setAppsTaskId(task.id)
    setAppsTaskName(task.name)
    setAppsLoading(true)
    try {
      const data = await api<{ applications: Application[] }>(`/applications/task/${task.id}`, { token: token! })
      setApplications(data.applications)
    } catch (err) {
      console.error(err)
    } finally {
      setAppsLoading(false)
    }
  }

  const openAppDetail = async (appId: string) => {
    setAppDetailLoading(true)
    try {
      const data = await api<AppDetail>(`/applications/${appId}/details`, { token: token! })
      setAppDetail(data)
    } catch (err) {
      console.error(err)
    } finally {
      setAppDetailLoading(false)
    }
  }

  const handleApprove = async (appId: string) => {
    setActionLoading(appId)
    try {
      await api(`/applications/${appId}/approve`, { method: 'PUT', token: token! })
      // Update local state
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a))
      if (appDetail?.application.id === appId) {
        setAppDetail(prev => prev ? { ...prev, application: { ...prev.application, status: 'APPROVED' } } : prev)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (appId: string) => {
    setActionLoading(appId)
    try {
      await api(`/applications/${appId}/reject`, { method: 'PUT', token: token! })
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'REJECTED' } : a))
      if (appDetail?.application.id === appId) {
        setAppDetail(prev => prev ? { ...prev, application: { ...prev.application, status: 'REJECTED' } } : prev)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const statusClass = (status: string) => {
    if (status === 'APPROVED') return styles.statusApproved
    if (status === 'REJECTED') return styles.statusRejected
    return styles.statusPending
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>← Back</button>
        <div>
          <h1 className={styles.pageTitle}>Task Management</h1>
          <p className={styles.pageSubtitle}>{tasks.length} tasks available</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ Add Task</button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className={styles.loadingState}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyText}>No tasks yet.</p>
          <p className={styles.emptySubtext}>Click "Add Task" to create your first task.</p>
        </div>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task, i) => (
            <div key={task.id} className={styles.taskRow}>
              <span className={styles.taskRowNum}>{i + 1}</span>
              <span className={styles.taskRowName}>
                {task.name}
                {task.requiresVerification && <span className={styles.verifyBadge}>Verified</span>}
              </span>
              <span className={styles.taskRowPay}>${task.userPayment} <em>/ person</em></span>
              <span className={styles.taskRowDeadline}>📅 {new Date(task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <div className={styles.taskRowActions}>
                <button className={styles.appsBtn} onClick={() => openApplications(task)}>
                  Applications <span className={styles.appsBadge}>{appCounts[task.id] ?? 0}</span>
                </button>
                <button className={styles.viewBtn} onClick={() => setViewTask(task)}>View</button>
                <button className={styles.editBtn} onClick={() => openEditTask(task)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)} disabled={deletingId === task.id}>
                  {deletingId === task.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Task Modal */}
      {viewTask && (
        <div className={styles.overlay} onClick={() => setViewTask(null)}>
          <div className={styles.viewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>{viewTask.name}</h3>
                {viewTask.requiresVerification && <span className={styles.verifyBadge}>Requires Verification</span>}
              </div>
              <button className={styles.closeBtn} onClick={() => setViewTask(null)}>✕</button>
            </div>
            <div className={styles.viewModalBody}>
              {viewTask.description && (
                <div className={styles.viewSection}>
                  <p className={styles.viewLabel}>Description</p>
                  <p className={styles.viewValue}>{viewTask.description}</p>
                </div>
              )}

              <div className={styles.viewPayRow}>
                <div className={styles.viewPayItem}>
                  <span>Full Payment</span>
                  <strong>${viewTask.fullPayment}</strong>
                </div>
                <div className={styles.viewPayItem}>
                  <span>Commission</span>
                  <strong>{viewTask.commission}%</strong>
                </div>
                <div className={`${styles.viewPayItem} ${styles.viewPayHighlight}`}>
                  <span>User Receives</span>
                  <strong>${viewTask.userPayment}</strong>
                </div>
              </div>

              <div className={styles.viewRegRow}>
                <div className={styles.viewRegItem}>
                  <span>Can Register</span>
                  <strong>{viewTask.maxRegistrations} people</strong>
                </div>
                <div className={styles.viewRegDivider} />
                <div className={styles.viewRegItem}>
                  <span>Will be Assigned</span>
                  <strong>{viewTask.maxAssignments} people</strong>
                </div>
                <div className={styles.viewRegDivider} />
                <div className={styles.viewRegItem}>
                  <span>Deadline</span>
                  <strong>{new Date(viewTask.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
              </div>

              {viewTask.docLinks.length > 0 && (
                <div className={styles.viewSection}>
                  <p className={styles.viewLabel}>Documents</p>
                  <div className={styles.docLinks}>
                    {viewTask.docLinks.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                        📄 Document {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className={styles.viewCreated}>Created on {new Date(viewTask.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <div className={styles.overlay} onClick={() => setEditTask(null)}>
          <div className={styles.formModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Task</h3>
              <button className={styles.closeBtn} onClick={() => setEditTask(null)}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'contents' }}>
              <div className={styles.taskForm}>
                <div className={styles.formGroup}>
                  <label>Task Name *</label>
                  <input
                    placeholder="e.g. Data Entry Project"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the task..."
                    rows={2}
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Document Links</label>
                  {editForm.docLinks.map((link, i) => (
                    <div key={i} className={styles.docLinkRow}>
                      <input
                        type="url"
                        placeholder="https://docs.example.com/..."
                        value={link}
                        onChange={e => updateEditDocLink(i, e.target.value)}
                      />
                      {editForm.docLinks.length > 1 && (
                        <button type="button" className={styles.removeLinkBtn} onClick={() => removeEditDocLink(i)}>✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className={styles.addLinkBtn} onClick={addEditDocLink}>+ Add Link</button>
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editForm.requiresVerification}
                    onChange={e => setEditForm(f => ({ ...f, requiresVerification: e.target.checked }))}
                  />
                  Requires Verification
                </label>

                <hr className={styles.formDivider} />

                <div className={styles.payGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Pay ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={editForm.fullPayment}
                      onChange={e => setEditForm(f => ({ ...f, fullPayment: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Commission (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={editForm.commission}
                      onChange={e => setEditForm(f => ({ ...f, commission: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>User Gets ($)</label>
                    <input readOnly value={editUserPaymentPreview} className={styles.readonlyInput} />
                  </div>
                </div>

                <hr className={styles.formDivider} />

                <div className={styles.payGrid}>
                  <div className={styles.formGroup}>
                    <label>Max Registrations</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={editForm.maxRegistrations}
                      onChange={e => setEditForm(f => ({ ...f, maxRegistrations: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Max Assignments</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={editForm.maxAssignments}
                      onChange={e => setEditForm(f => ({ ...f, maxAssignments: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Deadline</label>
                  <input
                    type="datetime-local"
                    value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                    required
                  />
                </div>

                {editError && <p className={styles.formError}>{editError}</p>}
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditTask(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.formModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Task</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
              <div className={styles.taskForm}>
                <div className={styles.formGroup}>
                  <label>Task Name *</label>
                  <input
                    placeholder="e.g. Data Entry Project"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the task..."
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Document Links</label>
                  {form.docLinks.map((link, i) => (
                    <div key={i} className={styles.docLinkRow}>
                      <input
                        type="url"
                        placeholder="https://docs.example.com/..."
                        value={link}
                        onChange={e => updateDocLink(i, e.target.value)}
                      />
                      {form.docLinks.length > 1 && (
                        <button type="button" className={styles.removeLinkBtn} onClick={() => removeDocLink(i)}>✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className={styles.addLinkBtn} onClick={addDocLink}>+ Add Link</button>
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.requiresVerification}
                    onChange={e => setForm(f => ({ ...f, requiresVerification: e.target.checked }))}
                  />
                  Requires Verification
                </label>

                <hr className={styles.formDivider} />

                <div className={styles.payGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Pay ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.fullPayment}
                      onChange={e => setForm(f => ({ ...f, fullPayment: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Commission (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={form.commission}
                      onChange={e => setForm(f => ({ ...f, commission: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>User Gets ($)</label>
                    <input readOnly value={userPaymentPreview} className={styles.readonlyInput} />
                  </div>
                </div>

                <hr className={styles.formDivider} />

                <div className={styles.payGrid}>
                  <div className={styles.formGroup}>
                    <label>Max Registrations</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={form.maxRegistrations}
                      onChange={e => setForm(f => ({ ...f, maxRegistrations: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Max Assignments</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={form.maxAssignments}
                      onChange={e => setForm(f => ({ ...f, maxAssignments: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Deadline</label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    required
                  />
                </div>

                {error && <p className={styles.formError}>{error}</p>}
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Applications List Modal ── */}
      {appsTaskId && (
        <div className={styles.overlay} onClick={() => { setAppsTaskId(null); setApplications([]) }}>
          <div className={styles.appsModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Applications — {appsTaskName}</h3>
              <button className={styles.closeBtn} onClick={() => { setAppsTaskId(null); setApplications([]) }}>✕</button>
            </div>
            <div className={styles.appsBody}>
              {appsLoading ? (
                <div className={styles.appsEmpty}>Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className={styles.appsEmpty}>No applications yet for this task.</div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className={styles.appRow}>
                    <div className={styles.appAvatar}>{app.user.name.charAt(0).toUpperCase()}</div>
                    <div className={styles.appInfo}>
                      <p className={styles.appName}>{app.user.name}</p>
                      <p className={styles.appEmail}>{app.user.email}</p>
                    </div>
                    <span className={`${styles.appStatusBadge} ${statusClass(app.status)}`}>
                      {app.status}
                    </span>
                    <button className={styles.appViewBtn} onClick={() => openAppDetail(app.id)}>View</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Application Detail Modal ── */}
      {(appDetail || appDetailLoading) && (
        <div className={styles.overlay} onClick={() => setAppDetail(null)} style={{ zIndex: 1000 }}>
          <div className={styles.appDetailModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Applicant Details</h3>
              <button className={styles.closeBtn} onClick={() => setAppDetail(null)}>✕</button>
            </div>
            {appDetailLoading ? (
              <div className={styles.appsEmpty}>Loading details...</div>
            ) : appDetail && (
              <>
                <div className={styles.appDetailBody}>
                  {/* User info */}
                  <div className={styles.appDetailUser}>
                    {appDetail.profile?.profilePhoto ? (
                      <img src={appDetail.profile.profilePhoto} alt="" className={styles.appDetailAvatarLg} />
                    ) : (
                      <div className={styles.appDetailAvatarFallback}>
                        {appDetail.application.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={styles.appDetailUserInfo}>
                      <h4>{appDetail.application.user.name}</h4>
                      <p>{appDetail.application.user.email}</p>
                    </div>
                  </div>

                  {/* Profile details */}
                  <div className={styles.appDetailGrid}>
                    {appDetail.profile?.phone && (
                      <div className={styles.appDetailItem}>
                        <span>Phone</span>
                        <p>{appDetail.profile.phoneCode ?? ''} {appDetail.profile.phone}</p>
                      </div>
                    )}
                    {appDetail.profile?.city && (
                      <div className={styles.appDetailItem}>
                        <span>Location</span>
                        <p>{[appDetail.profile.city, appDetail.profile.state, appDetail.profile.country].filter(Boolean).join(', ')}</p>
                      </div>
                    )}
                    {appDetail.profile?.documentType && (
                      <div className={styles.appDetailItem}>
                        <span>ID Document</span>
                        <p>{appDetail.profile.documentType}</p>
                      </div>
                    )}
                    <div className={styles.appDetailItem}>
                      <span>Status</span>
                      <p><span className={`${styles.appStatusBadge} ${statusClass(appDetail.application.status)}`}>{appDetail.application.status}</span></p>
                    </div>
                    <div className={styles.appDetailItem}>
                      <span>Applied On</span>
                      <p>{new Date(appDetail.application.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className={styles.appDetailItem}>
                      <span>Task</span>
                      <p>{appDetail.application.task.name}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className={styles.appDetailDocs}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-muted)' }}>Shared Documents</p>
                    {appDetail.profile?.resumeUrl && (
                      <a href={appDetail.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.appDetailDocLink}>
                        📄 Resume / CV
                      </a>
                    )}
                    {appDetail.profile?.documentFileData && (
                      <a href={appDetail.profile.documentFileData} target="_blank" rel="noopener noreferrer" className={styles.appDetailDocLink}>
                        🪪 ID Document
                      </a>
                    )}
                    {appDetail.profile?.profilePhoto && (
                      <a href={appDetail.profile.profilePhoto} target="_blank" rel="noopener noreferrer" className={styles.appDetailDocLink}>
                        📸 Profile Photo
                      </a>
                    )}
                    {!appDetail.profile?.resumeUrl && !appDetail.profile?.documentFileData && !appDetail.profile?.profilePhoto && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents shared.</p>
                    )}
                  </div>

                  {/* Payment Details — shown only for approved applicants */}
                  {appDetail.application.status === 'APPROVED' && appDetail.profile && (
                    (appDetail.profile.bankAccountName || appDetail.profile.paypalEmail) ? (
                      <div className={styles.appDetailDocs}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-muted)' }}>Payment Details</p>
                        <div className={styles.appDetailGrid}>
                          {appDetail.profile.bankAccountName && (
                            <div className={styles.appDetailItem}>
                              <span>Account Name</span>
                              <p>{appDetail.profile.bankAccountName}</p>
                            </div>
                          )}
                          {appDetail.profile.bankAccountNumber && (
                            <div className={styles.appDetailItem}>
                              <span>Account Number</span>
                              <p>{appDetail.profile.bankAccountNumber}</p>
                            </div>
                          )}
                          {appDetail.profile.bankRoutingNumber && (
                            <div className={styles.appDetailItem}>
                              <span>Routing Number</span>
                              <p>{appDetail.profile.bankRoutingNumber}</p>
                            </div>
                          )}
                          {appDetail.profile.bankSwiftCode && (
                            <div className={styles.appDetailItem}>
                              <span>SWIFT Code</span>
                              <p>{appDetail.profile.bankSwiftCode}</p>
                            </div>
                          )}
                          {appDetail.profile.paypalEmail && (
                            <div className={styles.appDetailItem}>
                              <span>PayPal Email</span>
                              <p>{appDetail.profile.paypalEmail}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.appDetailDocs}>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-muted)' }}>Payment Details</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No payment details provided.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Approve / Reject footer */}
                {appDetail.application.status === 'PENDING' && (
                  <div className={styles.appDetailFooter}>
                    <button
                      className={styles.approveBtn}
                      onClick={() => handleApprove(appDetail.application.id)}
                      disabled={actionLoading === appDetail.application.id}
                    >
                      {actionLoading === appDetail.application.id ? '...' : '✅ Approve'}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleReject(appDetail.application.id)}
                      disabled={actionLoading === appDetail.application.id}
                    >
                      {actionLoading === appDetail.application.id ? '...' : '❌ Reject'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement
