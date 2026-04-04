import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/UserDashboard'
import CompleteProfile from './pages/CompleteProfile'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import TaskManagement from './pages/admin/TaskManagement'
import BrowseProjects from './pages/BrowseProjects'
import AdminProfile from './pages/AdminProfile'
import ManagerProfile from './pages/ManagerProfile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import UserPayouts from './pages/UserPayouts'
import AdminPayouts from './pages/admin/AdminPayouts'
import ProtectedRoute from './components/ProtectedRoute'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#2D253C', color: '#fff', border: '1px solid rgba(213,156,250,0.3)', borderRadius: 12 } }} />
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/user/dashboard" element={<ProtectedRoute role="USER"><UserDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute role="ADMIN"><TaskManagement /></ProtectedRoute>} />
          <Route path="/manager/dashboard" element={<ProtectedRoute role="MANAGER"><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute role="USER"><CompleteProfile /></ProtectedRoute>} />
          <Route path="/manager/profile" element={<ProtectedRoute role="MANAGER"><ManagerProfile /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute role="ADMIN"><AdminProfile /></ProtectedRoute>} />
          <Route path="/user/projects" element={<ProtectedRoute role="USER"><BrowseProjects /></ProtectedRoute>} />
          <Route path="/user/payouts" element={<ProtectedRoute role="USER"><UserPayouts /></ProtectedRoute>} />
          <Route path="/admin/payouts" element={<ProtectedRoute role="ADMIN"><AdminPayouts /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
