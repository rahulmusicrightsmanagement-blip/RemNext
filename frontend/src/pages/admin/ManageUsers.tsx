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

  useEffect(() => {
    api<{ users: User[] }>('/auth/users', { token: token! })
      .then(d => setUsers(d.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
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

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>← Back</button>
        <div>
          <h1 className={styles.pageTitle}>Manage Users</h1>
          <p className={styles.pageSubtitle}>{users.length} registered users</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className={styles.resultCount}>{filtered.length} results</span>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading users...</div>
      ) : (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.tableEmpty}>No users found.</td></tr>
              ) : (
                filtered.map((u, i) => (
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
                      <span className={`${styles.rolePill} ${u.role === 'ADMIN' ? styles.adminPill : styles.userPill}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.viewBtn} onClick={() => setSelectedUser(u)}>View</button>
                        <button
                          className={styles.roleBtn}
                          onClick={() => toggleRole(u)}
                          disabled={updatingId === u.id}
                        >
                          {updatingId === u.id ? '...' : u.role === 'ADMIN' ? 'Set User' : 'Set Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                  <p><span className={`${styles.rolePill} ${selectedUser.role === 'ADMIN' ? styles.adminPill : styles.userPill}`}>{selectedUser.role}</span></p>
                </div>
                <div className={styles.detailItem}><span>Joined</span><p>{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.roleBtn}
                onClick={() => toggleRole(selectedUser)}
                disabled={updatingId === selectedUser.id}
              >
                {updatingId === selectedUser.id ? 'Updating...' : `Switch to ${selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN'}`}
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
