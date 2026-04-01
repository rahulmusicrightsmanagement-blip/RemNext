import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import styles from '../../styles/AdminPages.module.css'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

function ManageUsers() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'USERS' | 'MANAGERS'>('USERS')

  useEffect(() => {
    api<{ users: User[] }>('/auth/users', { token: token! })
      .then(d => setUsers(d.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const nextRole = (role: string) => {
    if (role === 'USER') return 'MANAGER'
    if (role === 'MANAGER') return 'ADMIN'
    return 'USER'
  }

  const changeRole = async (user: User, newRole: string) => {
    setUpdatingId(user.id)
    try {
      const data = await api<{ user: User }>(`/auth/users/${user.id}/role`, {
        method: 'PATCH',
        body: { role: newRole },
        token: token!,
      })
      setUsers(prev => prev.map(u => u.id === user.id ? data.user : u))
      if (selectedUser?.id === user.id) setSelectedUser(data.user)
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  const allManagers = users.filter(u => u.role === 'MANAGER')
  const allRegularUsers = users.filter(u => u.role === 'USER')

  const filteredManagers = allManagers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const filteredUsers = allRegularUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const displayList = activeTab === 'MANAGERS' ? filteredManagers : filteredUsers

  const renderTable = (list: User[]) => (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr><td colSpan={6} className={styles.tableEmpty}>No {activeTab === 'MANAGERS' ? 'managers' : 'users'} found.</td></tr>
          ) : (
            list.map((u, i) => (
              <tr key={u.id} className={styles.tableRow}>
                <td className={styles.rowNum}>{i + 1}</td>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>{u.name.charAt(0).toUpperCase()}</div>
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className={styles.emailCell}>{u.email}</td>
                <td>
                  <span className={`${styles.rolePill} ${u.role === 'ADMIN' ? styles.adminPill : u.role === 'MANAGER' ? styles.managerPill : styles.userPill}`}>
                    {u.role}
                  </span>
                </td>
                <td className={styles.dateCell}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.viewBtn} onClick={() => setSelectedUser(u)}>View</button>
                    {activeTab === 'USERS' ? (
                      <button
                        className={styles.roleBtn}
                        onClick={() => changeRole(u, 'MANAGER')}
                        disabled={updatingId === u.id}
                      >
                        {updatingId === u.id ? '...' : 'Set MANAGER'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={styles.roleBtn}
                          onClick={() => changeRole(u, 'ADMIN')}
                          disabled={updatingId === u.id}
                        >
                          {updatingId === u.id ? '...' : 'Set ADMIN'}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => changeRole(u, 'USER')}
                          disabled={updatingId === u.id}
                          style={{ fontSize: 11 }}
                        >
                          {updatingId === u.id ? '...' : 'Demote'}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>← Back</button>
        <div>
          <h1 className={styles.pageTitle}>Manage Users</h1>
          <p className={styles.pageSubtitle}>{allRegularUsers.length} users · {allManagers.length} managers</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        <button
          onClick={() => { setActiveTab('USERS'); setSearch('') }}
          style={{
            flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif', border: '1px solid var(--border-accent)',
            borderRadius: '12px 0 0 12px',
            background: activeTab === 'USERS' ? 'rgba(213,156,250,0.2)' : 'transparent',
            color: activeTab === 'USERS' ? 'var(--text-heading)' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          👤 Users ({allRegularUsers.length})
        </button>
        <button
          onClick={() => { setActiveTab('MANAGERS'); setSearch('') }}
          style={{
            flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif', border: '1px solid var(--border-accent)',
            borderRadius: '0 12px 12px 0', borderLeft: 'none',
            background: activeTab === 'MANAGERS' ? 'rgba(56,189,248,0.15)' : 'transparent',
            color: activeTab === 'MANAGERS' ? '#38bdf8' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          🛡 Managers ({allManagers.length})
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder={`Search ${activeTab === 'MANAGERS' ? 'managers' : 'users'} by name or email...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className={styles.resultCount}>{displayList.length} results</span>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading users...</div>
      ) : (
        renderTable(displayList)
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className={styles.overlay} onClick={() => setSelectedUser(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>User Details</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.avatarLarge}>{selectedUser.name.charAt(0).toUpperCase()}</div>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}><span>Name</span><p>{selectedUser.name}</p></div>
                <div className={styles.detailItem}><span>Email</span><p>{selectedUser.email}</p></div>
                <div className={styles.detailItem}><span>Role</span>
                  <p><span className={`${styles.rolePill} ${selectedUser.role === 'ADMIN' ? styles.adminPill : selectedUser.role === 'MANAGER' ? styles.managerPill : styles.userPill}`}>{selectedUser.role}</span></p>
                </div>
                <div className={styles.detailItem}><span>Joined</span><p>{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.roleBtn}
                onClick={() => changeRole(selectedUser, nextRole(selectedUser.role))}
                disabled={updatingId === selectedUser.id}
              >
                {updatingId === selectedUser.id ? 'Updating...' : `Set ${nextRole(selectedUser.role)}`}
              </button>
              <button className={styles.closeOutlineBtn} onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageUsers
