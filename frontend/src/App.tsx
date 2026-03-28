import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/UserDashboard'
import CompleteProfile from './pages/CompleteProfile'
import AdminDashboard from './pages/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import TaskManagement from './pages/admin/TaskManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user/dashboard" element={<ProtectedRoute role="USER"><UserDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute role="ADMIN"><TaskManagement /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute role="USER"><CompleteProfile /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
