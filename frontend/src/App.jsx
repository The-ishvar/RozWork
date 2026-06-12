import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import AdminLoginPage from './pages/AdminLoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import JobsPage from './pages/JobsPage'
import WorkersPage from './pages/WorkersPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import AdminPanelPage from './pages/AdminPanelPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <div className="px-4 py-16 text-center text-slate-500">Loading your workspace...</div>
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading, token } = useAuth()

  if (loading) return <div className="px-4 py-16 text-center text-slate-500">Loading your workspace...</div>
  return token || user ? <Navigate to="/dashboard" replace /> : children
}

const AdminPublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <div className="px-4 py-16 text-center text-slate-500">Loading your workspace...</div>
  return user?.role === 'admin' || user?.role === 'super_admin' ? <Navigate to="/admin" replace /> : children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <div className="px-4 py-16 text-center text-slate-500">Loading your workspace...</div>
  return user?.role === 'admin' || user?.role === 'super_admin' ? children : <Navigate to="/dashboard" replace />
}

const AppRoutes = () => {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><AuthPage mode="register" /></PublicRoute>} />
          <Route path="/admin/login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
