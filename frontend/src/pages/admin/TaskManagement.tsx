import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import styles from '../../styles/AdminPages.module.css'

const COUNTRIES = [
  'United States','United Kingdom','India','Canada','Australia','Germany','France',
  'Brazil','Mexico','Japan','China','South Korea','Singapore','UAE','South Africa',
  'Nigeria','Kenya','Pakistan','Bangladesh','Philippines','Indonesia','Malaysia',
  'Thailand','New Zealand','Netherlands','Sweden','Norway','Denmark','Switzerland',
  'Italy','Spain','Portugal','Poland','Argentina','Chile','Colombia','Other',
]

interface Task {
  id: string
  name: string
  description?: string
  country?: string
  requiresVerification: boolean
  fullPayment: number
  commission: number
  userPayment: number
  maxRegistrations: number
  maxAssignments: number
  deadline: string
  createdAt: string
  managerId?: string | null
  manager?: { id: string; name: string; email: string } | null
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
  mailSent: boolean
  managerId: string | null
  manager?: { id: string; name: string; email: string } | null
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
  application: Application & { task: { id: string; name: string; manager?: { id: string; name: string; email: string } }; verificationLinks: string[] }
  profile: UserProfile | null
}

const emptyForm = {
  name: '',
  description: '',
  fullPayment: '',
  commission: '',
  maxRegistrations: '',
  maxAssignments: '',
  deadline: '',
  managerId: '',
}

function TaskManagement() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formCountries, setFormCountries] = useState<string[]>([])
  const [countryOpen, setCountryOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editFormCountries, setEditFormCountries] = useState<string[]>([])
  const [editCountryOpen, setEditCountryOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const countryRef = useRef<HTMLDivElement>(null)
  const editCountryRef = useRef<HTMLDivElement>(null)

  // Applications state
  const [appsTaskId, setAppsTaskId] = useState<string | null>(null)
  const [appsTaskName, setAppsTaskName] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [appDetail, setAppDetail] = useState<AppDetail | null>(null)
  const [appDetailLoading, setAppDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [appCounts, setAppCounts] = useState<Record<string, number>>({})
  const [managersList, setManagersList] = useState<{ id: string; name: string; email: string }[]>([])
  const [countryFilter, setCountryFilter] = useState('')

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
        d.tasks.forEach(t => {
          api<{ applications: Application[] }>(`/applications/task/${t.id}`, { token: token! })
            .then(res => setAppCounts(prev => ({ ...prev, [t.id]: res.applications.length })))
            .catch(() => {})
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
    // Fetch managers list for assignment dropdown
    api<{ managers: { id: string; name: string; email: string }[] }>('/applications/managers-list', { token: token! })
      .then(d => setManagersList(d.managers))
      .catch(() => {})
  }, [token])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
      if (editCountryRef.current && !editCountryRef.current.contains(e.target as Node)) {
        setEditCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.fullPayment || !form.commission || formCountries.length === 0) {
      setError('Task name, country, payment and commission are required.')
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
          country: formCountries.join(', '),
          requiresVerification: false,
          fullPayment: form.fullPayment,
          commission: form.commission,
          maxRegistrations: form.maxRegistrations,
          maxAssignments: form.maxAssignments,
          deadline: form.deadline,
          managerId: form.managerId || undefined,
        },
      })
      setTasks(prev => [data.task, ...prev])
      setForm(emptyForm)
      setFormCountries([])
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
      fullPayment: String(task.fullPayment),
      commission: String(task.commission),
      maxRegistrations: String(task.maxRegistrations),
      maxAssignments: String(task.maxAssignments),
      deadline: new Date(task.deadline).toISOString().slice(0, 16),
      managerId: task.managerId ?? '',
    })
    setEditFormCountries(
      task.country ? task.country.split(',').map(c => c.trim()).filter(Boolean) : []
    )
    setEditError('')
  }

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!editTask) return
    setEditError('')
    if (!editForm.name || !editForm.fullPayment || !editForm.commission || editFormCountries.length === 0) {
      setEditError('Task name, country, payment and commission are required.')
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
          country: editFormCountries.join(', '),
          requiresVerification: false,
          fullPayment: editForm.fullPayment,
          commission: editForm.commission,
          maxRegistrations: editForm.maxRegistrations,
          maxAssignments: editForm.maxAssignments,
          deadline: editForm.deadline,
          managerId: editForm.managerId || undefined,
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

  const toggleCountry = (c: string, setFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFn(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
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

      {/* Country Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filter by Region:</label>
        <select
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 50, border: '1px solid var(--border-accent)',
            background: 'var(--bg-input)', color: 'var(--text-body)', fontSize: 13,
            fontFamily: 'Poppins, sans-serif', cursor: 'pointer', minWidth: 180,
          }}
        >
          <option value="">All Regions</option>
          {Array.from(new Set(tasks.flatMap(t => t.country ? t.country.split(',').map(c => c.trim()).filter(Boolean) : []))).sort().map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {countryFilter && (
          <button
            onClick={() => setCountryFilter('')}
            style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 50, cursor: 'pointer',
              border: '1px solid rgba(211,47,47,0.25)', background: 'rgba(211,47,47,0.06)',
              color: '#c62828', fontFamily: 'Poppins, sans-serif',
            }}
          >
            Clear filter
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {countryFilter ? tasks.filter(t => t.country?.split(',').map(c => c.trim()).includes(countryFilter)).length : tasks.length} of {tasks.length} tasks
        </span>
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
          {(countryFilter ? tasks.filter(t => t.country?.split(',').map(c => c.trim()).includes(countryFilter)) : tasks).map((task, i) => (
            <div key={task.id} className={styles.taskRow}>
              <span className={styles.taskRowNum}>{i + 1}</span>
              <span className={styles.taskRowName}>{task.name}</span>
              <span className={styles.taskRowPay}>${task.userPayment} <em>/ person</em></span>
              <span className={styles.taskRowDeadline}>📅 {new Date(task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className={styles.taskRowPay} style={{ fontSize: 13, opacity: 0.85 }}>
                {task.manager ? `👤 ${task.manager.name}` : '—'}
              </span>
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
              <h3>{viewTask.name}</h3>
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

              {viewTask.country && (
                <div className={styles.viewSection}>
                  <p className={styles.viewLabel}>Countries</p>
                  <div className={styles.viewCountryTags}>
                    {viewTask.country.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                      <span key={c} className={styles.viewCountryTag}>🌍 {c}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewTask.manager && (
                <div className={styles.viewSection}>
                  <p className={styles.viewLabel}>Assigned Manager</p>
                  <p className={styles.viewValue}>👤 {viewTask.manager.name} ({viewTask.manager.email})</p>
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
                  <label>Country *</label>
                  <div className={styles.multiSelectWrapper} ref={editCountryRef}>
                    <button
                      type="button"
                      className={styles.multiSelectTrigger}
                      onClick={() => setEditCountryOpen(o => !o)}
                    >
                      <span>
                        {editFormCountries.length === 0
                          ? 'Select countries...'
                          : `${editFormCountries.length} countr${editFormCountries.length === 1 ? 'y' : 'ies'} selected`}
                      </span>
                      <span>{editCountryOpen ? '▴' : '▾'}</span>
                    </button>
                    {editFormCountries.length > 0 && (
                      <div className={styles.multiSelectTags}>
                        {editFormCountries.map(c => (
                          <span key={c} className={styles.multiSelectTag}>
                            {c}
                            <button
                              type="button"
                              className={styles.multiSelectTagRemove}
                              onClick={() => toggleCountry(c, setEditFormCountries)}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    {editCountryOpen && (
                      <div className={styles.multiSelectDropdown}>
                        {COUNTRIES.map(c => (
                          <label key={c} className={styles.multiSelectOption}>
                            <input
                              type="checkbox"
                              checked={editFormCountries.includes(c)}
                              onChange={() => toggleCountry(c, setEditFormCountries)}
                            />
                            {c}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

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

                <div className={styles.formGroup}>
                  <label>Assign Manager</label>
                  <select
                    value={editForm.managerId}
                    onChange={e => setEditForm(f => ({ ...f, managerId: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-accent)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="">No manager assigned</option>
                    {managersList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
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
                  <label>Country *</label>
                  <div className={styles.multiSelectWrapper} ref={countryRef}>
                    <button
                      type="button"
                      className={styles.multiSelectTrigger}
                      onClick={() => setCountryOpen(o => !o)}
                    >
                      <span>
                        {formCountries.length === 0
                          ? 'Select countries...'
                          : `${formCountries.length} countr${formCountries.length === 1 ? 'y' : 'ies'} selected`}
                      </span>
                      <span>{countryOpen ? '▴' : '▾'}</span>
                    </button>
                    {formCountries.length > 0 && (
                      <div className={styles.multiSelectTags}>
                        {formCountries.map(c => (
                          <span key={c} className={styles.multiSelectTag}>
                            {c}
                            <button
                              type="button"
                              className={styles.multiSelectTagRemove}
                              onClick={() => toggleCountry(c, setFormCountries)}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    {countryOpen && (
                      <div className={styles.multiSelectDropdown}>
                        {COUNTRIES.map(c => (
                          <label key={c} className={styles.multiSelectOption}>
                            <input
                              type="checkbox"
                              checked={formCountries.includes(c)}
                              onChange={() => toggleCountry(c, setFormCountries)}
                            />
                            {c}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

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

                <div className={styles.formGroup}>
                  <label>Assign Manager</label>
                  <select
                    value={form.managerId}
                    onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-accent)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="">No manager assigned</option>
                    {managersList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
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
                      {app.manager && (
                        <p style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>Manager: {app.manager.name}</p>
                      )}
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
            {appDetailLoading ? (
              <div className={styles.appsEmpty} style={{ padding: 40 }}>Loading details...</div>
            ) : appDetail && (
              <>
                {/* ── Header ── */}
                <div className={styles.adHeader}>
                  <div className={styles.adHeaderLeft}>
                    {appDetail.profile?.profilePhoto ? (
                      <img src={appDetail.profile.profilePhoto} alt="" className={styles.appDetailAvatarLg} />
                    ) : (
                      <div className={styles.appDetailAvatarFallback}>
                        {appDetail.application.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className={styles.adName}>{appDetail.application.user.name}</p>
                      <p className={styles.adEmail}>{appDetail.application.user.email}</p>
                    </div>
                  </div>
                  <div className={styles.adHeaderRight}>
                    <span className={`${styles.appStatusBadge} ${statusClass(appDetail.application.status)}`}>
                      {appDetail.application.status}
                    </span>
                    <button className={styles.closeBtn} onClick={() => setAppDetail(null)}>✕</button>
                  </div>
                </div>

                {/* ── Two-column body ── */}
                <div className={styles.adBody}>
                  {/* LEFT — applicant info */}
                  <div className={styles.adLeft}>
                    <div className={styles.adSection}>
                      <p className={styles.adSectionTitle}>Application Info</p>
                      <div className={styles.appDetailGrid}>
                        <div className={styles.appDetailItem}>
                          <span>Task</span>
                          <p>{appDetail.application.task.name}</p>
                        </div>
                        <div className={styles.appDetailItem}>
                          <span>Applied On</span>
                          <p>{new Date(appDetail.application.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
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
                      </div>
                    </div>

                    <div className={styles.adSection}>
                      <p className={styles.adSectionTitle}>Shared Documents</p>
                      <div className={styles.appDetailDocs}>
                        {appDetail.profile?.resumeUrl && (
                          <a href={appDetail.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.appDetailDocLink}>📄 Resume / CV</a>
                        )}
                        {appDetail.profile?.documentFileData && (
                          <a href={appDetail.profile.documentFileData} target="_blank" rel="noopener noreferrer" className={styles.appDetailDocLink}>🪪 ID Document</a>
                        )}
                        {appDetail.profile?.profilePhoto && (
                          <a href={appDetail.profile.profilePhoto} target="_blank" rel="noopener noreferrer" className={styles.appDetailDocLink}>📸 Profile Photo</a>
                        )}
                        {!appDetail.profile?.resumeUrl && !appDetail.profile?.documentFileData && !appDetail.profile?.profilePhoto && (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents shared.</p>
                        )}
                      </div>
                    </div>

                    {appDetail.application.status === 'APPROVED' && appDetail.profile && (
                      <div className={styles.adSection}>
                        <p className={styles.adSectionTitle}>Payment Details</p>
                        {(appDetail.profile.bankAccountName || appDetail.profile.paypalEmail) ? (
                          <div className={styles.appDetailGrid}>
                            {appDetail.profile.bankAccountName && (
                              <div className={styles.appDetailItem}><span>Account Name</span><p>{appDetail.profile.bankAccountName}</p></div>
                            )}
                            {appDetail.profile.bankAccountNumber && (
                              <div className={styles.appDetailItem}><span>Account Number</span><p>{appDetail.profile.bankAccountNumber}</p></div>
                            )}
                            {appDetail.profile.bankRoutingNumber && (
                              <div className={styles.appDetailItem}><span>Routing Number</span><p>{appDetail.profile.bankRoutingNumber}</p></div>
                            )}
                            {appDetail.profile.bankSwiftCode && (
                              <div className={styles.appDetailItem}><span>SWIFT Code</span><p>{appDetail.profile.bankSwiftCode}</p></div>
                            )}
                            {appDetail.profile.paypalEmail && (
                              <div className={styles.appDetailItem}><span>PayPal Email</span><p>{appDetail.profile.paypalEmail}</p></div>
                            )}
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No payment details provided.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RIGHT — actions */}
                  <div className={styles.adRight}>
                    {appDetail.application.task.manager && (
                      <div className={styles.adSection}>
                        <p className={styles.adSectionTitle}>Task Manager</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                          👤 {appDetail.application.task.manager.name} ({appDetail.application.task.manager.email})
                        </p>
                      </div>
                    )}

                    {appDetail.application.mailSent && (
                      <div className={styles.adSection}>
                        <p className={styles.adSectionTitle} style={{ color: '#4ade80' }}>✉ Mail Sent by Manager</p>
                      </div>
                    )}

                    {appDetail.application.verificationLinks && appDetail.application.verificationLinks.length > 0 && (
                      <div className={styles.adSection}>
                        <p className={styles.adSectionTitle}>Previously Sent Links</p>
                        <div className={styles.adSentLinks}>
                          {appDetail.application.verificationLinks.map((link, i) => (
                            <div key={i} className={styles.adSentLink}>
                              <span className={styles.adSentLinkNum}>{i + 1}</span>
                              <a href={link} target="_blank" rel="noopener noreferrer" className={styles.adSentLinkUrl}>{link}</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {appDetail.application.status === 'PENDING' && (
                      <div className={styles.adActions}>
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
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement
