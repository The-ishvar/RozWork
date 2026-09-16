import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './components/ui/Toast'
import { ChatProvider } from './context/ChatContext'


const HomePage = lazy(() => import('./pages/HomePage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const JobsPage = lazy(() => import('./pages/JobsPage'))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'))
const WorkersPage = lazy(() => import('./pages/WorkersPage'))
const WorkerProfilePage = lazy(() => import('./pages/WorkerProfilePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const CoinWalletPage = lazy(() => import('./pages/CoinWalletPage'))

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      <p className="text-sm text-slate-400">Loading...</p>
    </div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading, token } = useAuth()
  if (loading) return <PageLoader />
  if (token || user) {
    const destination = user?.role === 'admin' || user?.role === 'super_admin' ? '/admin' : '/dashboard'
    return <Navigate to={destination} replace />
  }
  return children
}

const AdminPublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user?.role === 'admin' || user?.role === 'super_admin' ? <Navigate to="/admin" replace /> : children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user?.role === 'admin' || user?.role === 'super_admin' ? children : <Navigate to="/dashboard" replace />
}

const AppRoutes = () => {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-300 md:pb-0 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <BrowserRouter>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><AuthPage mode="register" /></PublicRoute>} />
              <Route path="/admin/login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/workers" element={<WorkersPage />} />
              <Route path="/workers/:id" element={<WorkerProfilePage />} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
              <Route path="/coins" element={<ProtectedRoute><CoinWalletPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
