import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  role: 'USER' | 'MANAGER' | 'ADMIN'
}

function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#58395B', fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== role) {
    const dashboardMap: Record<string, string> = {
      ADMIN: '/admin/dashboard',
      MANAGER: '/manager/dashboard',
      USER: '/user/dashboard',
    }
    return <Navigate to={dashboardMap[user.role] || '/user/dashboard'} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
