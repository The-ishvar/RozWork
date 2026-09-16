import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  BellRing,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  LayoutGrid,
  Menu,
  Percent,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const defaultSettings = {
  siteName: 'RozWork',
  logoUrl: '',
  bannerUrl: '',
  contactEmail: 'ishvar96@gmail.com',
  contactPhone: ' 9660585691',
  socialLinks: 'https://linkedin.com, https://instagram.com',
}

const AdminPanelPage = () => {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newRegistrations: 0,
    totalLogins: 0,
    workers: 0,
    employers: 0,
    businesses: 0,
    farmers: 0,
    admins: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingJobs: 0,
    totalPosts: 0,
    totalNotifications: 0,
    purchasesMade: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalReviews: 0,
    monthlyGrowth: [],
    weeklyTrend: [],
    dailyBookings: [],
    dailyJobs: [],
  })
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [posts, setPosts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activities, setActivities] = useState([])
  const [pendingContent, setPendingContent] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [search, setSearch] = useState('')
  const [userFilters, setUserFilters] = useState({ phone: '', username: '', date: '' })
  const [auditType, setAuditType] = useState('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [settings, setSettings] = useState(defaultSettings)
  const [postForm, setPostForm] = useState({ title: '', excerpt: '', body: '', slug: '', category: 'general', status: 'pending' })
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingUser, setEditingUser] = useState({ name: '', email: '', phone: '', profession: '', location: '', role: 'worker' })
  const [adminBookings, setAdminBookings] = useState([])
  const [adminPayments, setAdminPayments] = useState([])
  const [bookingFilter, setBookingFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [commissionSettings, setCommissionSettings] = useState({ employerCommission: 10, workerCommission: 2 })
  const [paymentGatewaySettings, setPaymentGatewaySettings] = useState({ razorpayEnabled: true, upiEnabled: true, phonepeEnabled: true, gpayEnabled: true, paytmEnabled: true, razorpayKeyId: '', razorpayKeySecret: '' })
  const [bookingRuleSettings, setBookingRuleSettings] = useState({ minBookingAmount: 100, maxBookingAmount: 1000000, autoCancelDays: 7 })
  const [coinRequests, setCoinRequests] = useState([])
  const [coinHistory, setCoinHistory] = useState([])
  const [coinWalletSearch, setCoinWalletSearch] = useState('')
  const [coinAdjustForm, setCoinAdjustForm] = useState({ userId: '', amount: '', action: 'add', reason: '', adminPassword: '' })
  const [coinLimitForm, setCoinLimitForm] = useState({ userId: '', dailyCoinLimit: '', adminPassword: '' })
  const [coinSettings, setCoinSettings] = useState({ phonePeNumber: '9660585691', upiId: 'rozwork@upi', qrCodeUrl: '', coinRate: 1, adminPassword: '9660585691', packages: [], usageRules: { jobPosts: 20, jobPostCoins: 50, featuredJobCoins: 10, premiumEmployerCoins: 100, advertisementCoins: 200 } })
  const [paymentRequestSearch, setPaymentRequestSearch] = useState('')
  const [paymentRequestStatusFilter, setPaymentRequestStatusFilter] = useState('all')
  const [paymentRequestDateFilter, setPaymentRequestDateFilter] = useState('')

  const recentLogins = useMemo(() => auditLogs.filter((entry) => entry.action === 'login').slice(0, 6), [auditLogs])
  const activeUserList = useMemo(() => users.filter((entry) => !entry.isSuspended && !entry.isBanned).slice(0, 6), [users])

  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const loadDashboard = async () => {
    if (!token) return

    const safeGet = async (url) => {
      try {
        return await apiClient.get(url, authHeaders)
      } catch (error) {
        console.warn(`[admin] failed to load ${url}:`, error?.response?.data?.message || error.message)
        return null
      }
    }

    const overviewRes = await safeGet('/admin/overview')
    const statsRes = await safeGet('/admin/stats')
    const settingsRes = await safeGet('/admin/settings')
    const notificationsRes = await safeGet('/admin/notifications')
    const auditRes = await safeGet('/admin/audit')
    const bookingsRes = await safeGet('/admin/bookings/tracking')
    const paymentsRes = await safeGet('/admin/payments')
    const coinRequestsRes = await safeGet('/coins/admin/requests')
    const coinHistoryRes = await safeGet('/coins/admin/history')
    const coinSettingsRes = await safeGet('/coins/settings')

    const overview = overviewRes?.data || {}
    const statsPayload = statsRes?.data?.stats || {}
    setStats((previous) => ({ ...previous, ...(overview.stats || {}), ...statsPayload }))
    setUsers(overview.users || [])
    setJobs(overview.jobs || [])
    setPosts(overview.posts || [])
    setNotifications(notificationsRes?.data?.notifications || [])
    setActivities(overview.activities || [])
    setPendingContent(overview.pendingContent || [])
    setAuditLogs(auditRes?.data?.logs || overview.auditLogs || [])
    setSettings({ ...defaultSettings, ...(settingsRes?.data?.settings || {}) })
    setAdminBookings(bookingsRes?.data?.bookings || [])
    setAdminPayments(paymentsRes?.data?.payments || [])
    const sortedCoinRequests = (coinRequestsRes?.data?.requests || []).sort((a, b) => {
      const order = { pending: 0, approved: 1, rejected: 2 }
      return (order[a.status] ?? 99) - (order[b.status] ?? 99)
    })
    setCoinRequests(sortedCoinRequests)
    setCoinHistory(coinHistoryRes?.data?.history || [])
    setCoinSettings(coinSettingsRes?.data?.settings || { phonePeNumber: '9660585691', upiId: 'rozwork@upi', qrCodeUrl: '', coinRate: 1, adminPassword: '9660585691', packages: [], usageRules: { jobPosts: 20, jobPostCoins: 50, featuredJobCoins: 10, premiumEmployerCoins: 100, advertisementCoins: 200 } })
    const allSettings = settingsRes?.data?.settings || {}
    setCommissionSettings({
      employerCommission: Number(allSettings.employerCommission ?? 10),
      workerCommission: Number(allSettings.workerCommission ?? 2),
    })
    setPaymentGatewaySettings({
      razorpayEnabled: allSettings.razorpayEnabled !== false,
      upiEnabled: allSettings.upiEnabled !== false,
      phonepeEnabled: allSettings.phonepeEnabled !== false,
      gpayEnabled: allSettings.gpayEnabled !== false,
      paytmEnabled: allSettings.paytmEnabled !== false,
      razorpayKeyId: allSettings.razorpayKeyId || '',
      razorpayKeySecret: allSettings.razorpayKeySecret || '',
    })
    setBookingRuleSettings({
      minBookingAmount: Number(allSettings.minBookingAmount ?? 100),
      maxBookingAmount: Number(allSettings.maxBookingAmount ?? 1000000),
      autoCancelDays: Number(allSettings.autoCancelDays ?? 7),
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [token])

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase()
    const phoneQuery = userFilters.phone.toLowerCase()
    const usernameQuery = userFilters.username.toLowerCase()
    const dateQuery = userFilters.date

    return users.filter((entry) => {
      const haystack = [entry.name, entry.email, entry.role, entry.profession, entry.phone, entry.username, entry.location, entry.companyName].join(' ').toLowerCase()
      const matchesQuery = haystack.includes(query)
      const matchesPhone = !phoneQuery || (entry.phone || '').toLowerCase().includes(phoneQuery)
      const matchesUsername = !usernameQuery || (entry.username || '').toLowerCase().includes(usernameQuery)
      const matchesDate = !dateQuery || (entry.createdAt || entry.joinDate || '').toString().slice(0, 10) === dateQuery
      return matchesQuery && matchesPhone && matchesUsername && matchesDate
    })
  }, [search, userFilters, users])

  const filteredAuditLogs = useMemo(() => {
    const query = auditSearch.toLowerCase()
    return auditLogs.filter((entry) => {
      const haystack = [entry.userName, entry.email, entry.phone, entry.username, entry.ipAddress, entry.browser, entry.deviceType, entry.details?.role].join(' ').toLowerCase()
      const matchesType = auditType === 'all' || entry.type === auditType
      const matchesQuery = !query || haystack.includes(query)
      return matchesType && matchesQuery
    })
  }, [auditLogs, auditSearch, auditType])

  const handleAuthAction = async (endpoint, payload, successMessage) => {
    try {
      await apiClient(endpoint, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        data: payload,
      })
      setMessage(successMessage)
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'The request could not be completed.')
    }
  }

  const handleUserStatus = async (userId, status) => {
    await handleAuthAction(`/admin/users/${userId}`, { status }, `User status updated to ${status}.`)
  }

  const handleUserRoleChange = async (userId, role) => {
    await handleAuthAction(`/admin/users/${userId}`, { role }, `User role updated to ${role}.`)
  }

  const handleDeleteUser = async (userId) => {
    try {
      await apiClient.delete(`/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('User removed from the platform.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to remove the user.')
    }
  }

  const handleModeration = async (type, itemId, action) => {
    try {
      await apiClient.post('/admin/moderation', { type, id: itemId, action }, { headers: { Authorization: `Bearer ${token}` } })
      setMessage(`${type} ${action}d successfully.`)
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Moderation action failed.')
    }
  }

  const handleContentSave = async (event) => {
    event.preventDefault()
    try {
      await apiClient.post('/admin/content', postForm, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Content submitted to the moderation queue.')
      setPostForm({ title: '', excerpt: '', body: '', slug: '', category: 'general', status: 'pending' })
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to create the post.')
    }
  }

  const handlePostUpdate = async (postId, updates) => {
    try {
      await apiClient.patch(`/admin/content/${postId}`, updates, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Content updated successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update the content.')
    }
  }

  const handlePostDelete = async (postId) => {
    try {
      await apiClient.delete(`/admin/content/${postId}`, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Post deleted successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete the content.')
    }
  }

  const handleCoinReview = async (requestId, status) => {
    try {
      await apiClient.post(`/coins/admin/requests/${requestId}/review`, { status, adminPassword: coinSettings.adminPassword, adminNote: '' }, { headers: { Authorization: `Bearer ${token}` } })
      setMessage(`Coin request ${status}d successfully.`)
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to review the coin request.')
    }
  }

  const handleCoinAdjustment = async (event) => {
    event.preventDefault()
    try {
      await apiClient.post('/coins/admin/adjust', coinAdjustForm, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Coin adjustment completed.')
      setCoinAdjustForm({ userId: '', amount: '', action: 'add', reason: '', adminPassword: '' })
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to adjust coins.')
    }
  }

  const handleCoinLimitUpdate = async (event) => {
    event.preventDefault()
    try {
      await apiClient.post('/coins/admin/limit', coinLimitForm, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Daily coin limit updated.')
      setCoinLimitForm({ userId: '', dailyCoinLimit: '', adminPassword: '' })
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update daily coin limit.')
    }
  }

  const handleCoinSettingsSave = async () => {
    try {
      await apiClient.post('/coins/settings', coinSettings, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Coin settings saved successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save coin settings.')
    }
  }

  const handleDeleteJob = async (jobId) => {
    try {
      await apiClient.delete(`/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Job deleted successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete the job.')
    }
  }

  const handleSettingsSave = async (event) => {
    event.preventDefault()
    try {
      await apiClient.put('/admin/settings', settings, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Website settings saved successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save website settings.')
    }
  }

  const handleBulkAction = async (action, type) => {
    try {
      await apiClient.post('/admin/bulk-action', { action, type }, { headers: { Authorization: `Bearer ${token}` } })
      setMessage(`Bulk ${action} completed for ${type}.`)
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Bulk action failed.')
    }
  }

  const startEditingUser = (entry) => {
    setEditingUserId(entry.id)
    setEditingUser({
      name: entry.name || '',
      email: entry.email || '',
      phone: entry.phone || '',
      profession: entry.profession || '',
      location: entry.location || '',
      role: entry.role || 'worker',
    })
  }

  const saveEditedUser = async (userId) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, editingUser, { headers: { Authorization: `Bearer ${token}` } })
      setEditingUserId(null)
      setMessage('User details updated.')
      await loadDashboard()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update user details.')
    }
  }

  const exportUsers = () => {
    const rows = [['Name', 'Email', 'Role', 'Location', 'Status']]
    users.forEach((entry) => rows.push([entry.name, entry.email, entry.role, entry.location || '', entry.isBanned ? 'Blocked' : 'Active']))
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rozwork-users.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderStatsCards = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600"><Users size={18} /> Total users</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalUsers}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600"><ShieldCheck size={18} /> Active users</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.activeUsers}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-amber-600"><Briefcase size={18} /> Active jobs</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.activeJobs}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-violet-600"><BellRing size={18} /> Revenue</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">₹{stats.totalRevenue || 0}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sky-600"><UserRound size={18} /> Employers</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.employers || 0}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-rose-600"><CheckCircle2 size={18} /> Reviews</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.totalReviews || 0}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-fuchsia-600"><ShieldCheck size={18} /> Premium members</div>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.premiumUsers || 0}</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!['admin', 'super_admin'].includes(user.role)) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:w-72">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Admin control</p>
              <h1 className="text-xl font-semibold">{user.name}</h1>
            </div>
            <div className="rounded-full bg-blue-50 p-2 text-blue-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {[
              { id: 'overview', label: t('admin.navOverview', 'Overview'), icon: LayoutGrid },
              { id: 'users', label: t('admin.navUsers', 'User Management'), icon: Users },
              { id: 'bookings', label: 'Bookings', icon: Briefcase },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'paymentRequests', label: 'Payment Requests', icon: CreditCard },
              { id: 'commission', label: 'Commission', icon: Percent },
              { id: 'paymentsGateway', label: 'Payment Gateway', icon: Wallet },
              { id: 'bookingRules', label: 'Booking Rules', icon: Settings },
              { id: 'coins', label: 'Coin Wallet', icon: Wallet },
              { id: 'activity', label: t('admin.navActivity', 'Activity Log'), icon: ShieldCheck },
              { id: 'moderation', label: t('admin.navModeration', 'Moderation'), icon: ClipboardList },
              { id: 'content', label: t('admin.navContent', 'Content'), icon: BarChart3 },
              { id: 'settings', label: t('admin.navSettings', 'Settings'), icon: Settings },
              { id: 'notifications', label: t('admin.navNotifications', 'Notifications'), icon: BellRing },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const badge = item.id === 'paymentRequests' ? coinRequests.filter((r) => r.status === 'pending').length : 0
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  <Icon size={16} />
                  {item.label}
                  {badge > 0 ? <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">{badge}</span> : null}
                </button>
              )
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-900"><Menu size={16} /> {t('admin.controlCenter', 'Control center')}</div>
            <p className="mt-2">{t('admin.controlCenterDescription', 'Approve new submissions, manage trusted accounts, and keep website content under review.')}</p>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">{t('admin.operationsDashboard', 'Operations dashboard')}</p>
                <h2 className="mt-2 text-3xl font-semibold">{t('admin.websiteControlTitle', 'Secure website control for RozWork')}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">{t('admin.websiteControlDescription', 'Review registrations, moderate new content, manage users, and update site settings from a single responsive panel.')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => loadDashboard()} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"> <RefreshCw size={16} className="mr-2 inline" /> {t('admin.refresh', 'Refresh')}</button>
                <button onClick={exportUsers} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white"> <Upload size={16} className="mr-2 inline" /> {t('admin.exportCsv', 'Export CSV')}</button>
              </div>
            </div>
            {message ? <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div> : null}
          </section>

          {activeTab === 'overview' ? (
            <>
              {renderStatsCards()}
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('admin.recentActivity', 'Recent activity')}</h3>
                      <p className="text-sm text-slate-500">{t('admin.recentActivityDescription', 'Every registration, post, and admin action is logged here.')}</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">Live feed</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activities.length ? activities.map((activity) => (
                      <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{activity.message}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{new Date(activity.createdAt).toLocaleString()}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No activity yet.</p>}
                  </div>
                </section>
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('admin.growthChart', 'Growth chart')}</h3>
                      <p className="text-sm text-slate-500">{t('admin.growthChartDescription', 'Last six months of signed-up users.')}</p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-700">+{stats.totalUsers}</div>
                  </div>
                  <div className="mt-6 flex h-48 items-end gap-3">
                    {stats.monthlyGrowth.length ? stats.monthlyGrowth.map((point) => (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-36 w-full items-end rounded-full bg-slate-100 p-1">
                          <div className="w-full rounded-full bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: `${Math.max(10, (point.count / Math.max(...stats.monthlyGrowth.map((item) => item.count), 1)) * 100)}%` }} />
                        </div>
                        <div className="text-center text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">{point.label}</p>
                          <p>{point.count}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-500">Growth data will appear once more users register.</p>}
                  </div>
                </section>
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('admin.activeUsers', 'Active users')}</h3>
                      <p className="text-sm text-slate-500">{t('admin.activeUsersDescription', 'Accounts that are currently eligible to use the platform.')}</p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{stats.activeUsers}</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activeUserList.length ? activeUserList.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{entry.name}</p>
                          <p className="text-sm text-slate-500">{entry.role} • {entry.email}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Online</span>
                      </div>
                    )) : <p className="text-sm text-slate-500">No active users right now.</p>}
                  </div>
                </section>
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('admin.recentLogins', 'Recent logins')}</h3>
                      <p className="text-sm text-slate-500">{t('admin.recentLoginsDescription', 'Recent sign-ins and authentications from the team and members.')}</p>
                    </div>
                    <div className="rounded-full bg-blue-50 px-3 py-2 text-sm text-blue-700">{recentLogins.length}</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {recentLogins.length ? recentLogins.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">{entry.username || entry.userName || entry.message || 'Login'}</p>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{entry.role || 'member'}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{entry.message || 'Successful login'}</p>
                        <p className="mt-2 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No recent logins yet.</p>}
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {activeTab === 'users' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t('admin.userManagement', 'User management')}</h3>
                  <p className="text-sm text-slate-500">{t('admin.userManagementDescription', 'Search, edit, block, unblock, and remove accounts instantly.')}</p>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" placeholder={t('admin.searchUsersPlaceholder', 'Search users')} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input value={userFilters.phone} onChange={(event) => setUserFilters({ ...userFilters, phone: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Search by mobile number" />
                <input value={userFilters.username} onChange={(event) => setUserFilters({ ...userFilters, username: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Search by username" />
                <input type="date" value={userFilters.date} onChange={(event) => setUserFilters({ ...userFilters, date: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Name</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Email</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Role</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-900">{entry.name}</div>
                          <div className="text-xs text-slate-500">{entry.profession || entry.companyName || 'No profession listed'}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{entry.email}</td>
                        <td className="px-3 py-3 text-slate-600">{entry.role}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-3 py-1 text-sm font-medium ${entry.isBanned ? 'bg-red-50 text-red-700' : entry.isSuspended ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{entry.isBanned ? 'Blocked' : entry.isSuspended ? 'Suspended' : 'Active'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => startEditingUser(entry)} className="rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">Edit</button>
                            <button onClick={() => handleUserStatus(entry.id, entry.isBanned ? 'active' : 'ban')} className="rounded-full border border-red-200 px-2 py-1 text-xs font-medium text-red-700">{entry.isBanned ? 'Unblock' : 'Block'}</button>
                            <button onClick={() => handleDeleteUser(entry.id)} className="rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700"><Trash2 size={12} className="mr-1 inline" />Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editingUserId ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Edit user profile</h4>
                    <button onClick={() => setEditingUserId(null)} className="text-sm text-slate-500">Cancel</button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <input value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Name" />
                    <input value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Email" />
                    <input value={editingUser.phone} onChange={(event) => setEditingUser({ ...editingUser, phone: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Phone" />
                    <input value={editingUser.profession} onChange={(event) => setEditingUser({ ...editingUser, profession: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Profession" />
                    <input value={editingUser.location} onChange={(event) => setEditingUser({ ...editingUser, location: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Location" />
                    <select value={editingUser.role} onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      <option value="worker">Worker</option>
                      <option value="employer">Employer</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => saveEditedUser(editingUserId)} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white">Save changes</button>
                    <button onClick={() => handleUserRoleChange(editingUserId, editingUser.role)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Update role</button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === 'activity' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Security activity</h3>
                  <p className="text-sm text-slate-500">Track every successful login and registration from the platform.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={auditType} onChange={(event) => setAuditType(event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <option value="all">All events</option>
                    <option value="login">Login</option>
                    <option value="registration">Registration</option>
                  </select>
                  <input value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="Search audit log" />
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Event</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">User</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Contact</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Device</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAuditLogs.map((entry) => (
                      <tr key={entry.id || `${entry.type}-${entry.createdAt}`}>
                        <td className="px-3 py-3 font-medium text-slate-900">{entry.type}</td>
                        <td className="px-3 py-3 text-slate-700">{entry.userName || entry.username}</td>
                        <td className="px-3 py-3 text-slate-600">{entry.email || entry.phone}</td>
                        <td className="px-3 py-3 text-slate-600">{entry.deviceType || 'Unknown'} • {entry.browser?.slice(0, 40) || 'Unknown'}</td>
                        <td className="px-3 py-3 text-slate-600">{new Date(entry.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeTab === 'moderation' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Moderation queue</h3>
                  <p className="text-sm text-slate-500">Approve, reject, or remove submissions before they go live.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleBulkAction('approve', 'jobs')} className="rounded-full border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700">Approve all jobs</button>
                  <button onClick={() => handleBulkAction('reject', 'posts')} className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-700">Reject all posts</button>
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {pendingContent.length ? pendingContent.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.label}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">{item.status}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => handleModeration(item.type, item.id, 'approve')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Approve</button>
                      <button onClick={() => handleModeration(item.type, item.id, 'reject')} className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-700">Reject</button>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500">Nothing is waiting for moderation right now.</p>}
              </div>
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-semibold text-slate-900">Job approval queue</h4>
                <div className="mt-4 space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{job.title}</p>
                        <p className="text-sm text-slate-500">{job.category} • {job.location}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleModeration('job', job.id, 'approve')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Approve</button>
                        <button onClick={() => handleModeration('job', job.id, 'reject')} className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-700">Reject</button>
                        <button onClick={() => handleDeleteJob(job.id)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'content' ? (
            <section className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Create content</h3>
                <p className="mt-1 text-sm text-slate-500">Create new posts for the homepage and manage their publication status.</p>
                <form onSubmit={handleContentSave} className="mt-4 grid gap-4 md:grid-cols-2">
                  <input value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Title" required />
                  <input value={postForm.slug} onChange={(event) => setPostForm({ ...postForm, slug: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Slug" />
                  <input value={postForm.category} onChange={(event) => setPostForm({ ...postForm, category: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Category" />
                  <select value={postForm.status} onChange={(event) => setPostForm({ ...postForm, status: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="pending">Pending</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <textarea value={postForm.excerpt} onChange={(event) => setPostForm({ ...postForm, excerpt: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Excerpt" rows="3" />
                  <textarea value={postForm.body} onChange={(event) => setPostForm({ ...postForm, body: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Body" rows="5" />
                  <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white md:col-span-2">Create post</button>
                </form>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Manage posts</h3>
                <div className="mt-4 space-y-3">
                  {posts.length ? posts.map((post) => (
                    <div key={post.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{post.title}</p>
                          <p className="text-sm text-slate-500">{post.excerpt || 'No excerpt supplied.'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handlePostUpdate(post.id, { status: post.status === 'published' ? 'draft' : 'published' })} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">{post.status === 'published' ? 'Draft' : 'Publish'}</button>
                          <button onClick={() => handlePostDelete(post.id)} className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No content has been created yet.</p>}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'settings' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Website settings</h3>
              <p className="mt-1 text-sm text-slate-500">Manage the public identity of your site, contact information, and social links.</p>
              <form onSubmit={handleSettingsSave} className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={settings.siteName || ''} onChange={(event) => setSettings({ ...settings, siteName: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Website name" />
                <input value={settings.logoUrl || ''} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Logo URL" />
                <input value={settings.bannerUrl || ''} onChange={(event) => setSettings({ ...settings, bannerUrl: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Banner URL" />
                <input value={settings.contactEmail || ''} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Contact email" />
                <input value={settings.contactPhone || ''} onChange={(event) => setSettings({ ...settings, contactPhone: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Contact phone" />
                <input value={settings.socialLinks || ''} onChange={(event) => setSettings({ ...settings, socialLinks: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Social links" />
                <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white md:col-span-2">Save settings</button>
              </form>
            </section>
          ) : null}

          {activeTab === 'notifications' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  <p className="text-sm text-slate-500">All incoming platform alerts and moderation notices.</p>
                </div>
                <button onClick={() => window.print()} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Print / PDF</button>
              </div>
              <div className="mt-6 space-y-3">
                {notifications.length ? notifications.map((notification) => (
                  <div key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><AlertCircle size={16} /> {notification.type || 'Info'}</div>
                    <p className="mt-2 text-sm text-slate-700">{notification.message}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">No notifications yet.</p>}
              </div>
            </section>
          ) : null}

          {activeTab === 'bookings' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Booking Management</h3>
                  <p className="text-sm text-slate-500">Track and manage all bookings, commissions, and refunds.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <a href="/api/admin/export/bookings?format=csv" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"><Download size={14} /> Export CSV</a>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Service</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Employer</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Worker</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Amount</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Commission</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Refund</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(bookingFilter ? adminBookings.filter((b) => b.status === bookingFilter) : adminBookings).slice(0, 50).map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-3 py-3 font-medium text-slate-900">{booking.serviceTitle}</td>
                        <td className="px-3 py-3 text-slate-600">{booking.employerName}</td>
                        <td className="px-3 py-3 text-slate-600">{booking.workerName}</td>
                        <td className="px-3 py-3 text-slate-600">₹{booking.amount}</td>
                        <td className="px-3 py-3">
                          <span className="text-amber-600 font-medium">₹{booking.totalPlatformCommission || 0}</span>
                          <span className="ml-1 text-xs text-slate-400">({booking.employerCommissionAmount || 0}+{booking.workerCommissionAmount || 0})</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${booking.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : booking.status === 'pending' ? 'bg-amber-50 text-amber-700' : booking.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>{booking.status?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-3 py-3">
                          {booking.refundStatus === 'pending' ? (
                            <div className="flex gap-1">
                              <button onClick={async () => { await apiClient.patch(`/admin/refunds/${booking.id}`, { action: 'approve' }, { headers: { Authorization: `Bearer ${token}` } }); loadDashboard() }} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button>
                              <button onClick={async () => { await apiClient.patch(`/admin/refunds/${booking.id}`, { action: 'reject' }, { headers: { Authorization: `Bearer ${token}` } }); loadDashboard() }} className="rounded bg-rose-600 px-2 py-1 text-xs text-white">Reject</button>
                            </div>
                          ) : booking.refundStatus !== 'none' ? (
                            <span className="text-xs text-slate-500">{booking.refundStatus}</span>
                          ) : <span className="text-xs text-slate-400">-</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adminBookings.length === 0 && <p className="mt-4 text-sm text-slate-500">No bookings found.</p>}
            </section>
          ) : null}

          {activeTab === 'payments' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Payment Management</h3>
                  <p className="text-sm text-slate-500">View all transactions, revenue, and commission details.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <option value="">All Types</option>
                    <option value="service_payment">Service Payment</option>
                    <option value="booking_fee">Booking Fee</option>
                    <option value="application_fee">Application Fee</option>
                    <option value="premium_membership">Premium</option>
                    <option value="refund">Refund</option>
                  </select>
                  <a href="/api/admin/export/payments?format=csv" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"><Download size={14} /> Export CSV</a>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">₹{stats.totalRevenue || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Employer Commission</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">₹{stats.employerCommission || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Worker Commission</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-600">₹{stats.workerCommission || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total Commission</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">₹{stats.totalCommission || 0}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Today&apos;s Income</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">₹{stats.todayRevenue || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Monthly Income</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">₹{stats.monthlyRevenue || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Payment Success</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{stats.paymentSuccess || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Refunds</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{stats.refunds || 0}</p>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Employer</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Worker</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Amount</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Employer Comm</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Worker Comm</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Method</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(paymentFilter ? adminPayments.filter((p) => p.paymentType === paymentFilter) : adminPayments).slice(0, 50).map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-3 py-3 text-slate-600">{payment.employerName}</td>
                        <td className="px-3 py-3 text-slate-600">{payment.workerName}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">₹{payment.amount}</td>
                        <td className="px-3 py-3 text-amber-600">₹{payment.employerCommission || 0}</td>
                        <td className="px-3 py-3 text-rose-600">₹{payment.workerCommission || 0}</td>
                        <td className="px-3 py-3 text-xs text-slate-500">{payment.paymentType?.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-3 text-xs text-slate-500">{payment.paymentMethod || '-'}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'failed' ? 'bg-rose-50 text-rose-700' : payment.status === 'refunded' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{payment.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adminPayments.length === 0 && <p className="mt-4 text-sm text-slate-500">No payments found.</p>}
            </section>
          ) : null}

          {activeTab === 'commission' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold">Commission Settings</h3>
                <p className="text-sm text-slate-500">Configure employer and worker commission percentages. These apply to all new bookings.</p>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-2 text-amber-600"><Percent size={20} /> Employer Commission</div>
                  <p className="mt-2 text-sm text-slate-500">Charged to the employer on top of the job price. Default: 10%</p>
                  <div className="mt-4 flex items-center gap-3">
                    <input type="number" value={commissionSettings.employerCommission} onChange={(e) => setCommissionSettings({ ...commissionSettings, employerCommission: Number(e.target.value) })} min="0" max="50" className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-lg font-bold" />
                    <span className="text-lg font-medium text-slate-600">%</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-2 text-rose-600"><Percent size={20} /> Worker Commission</div>
                  <p className="mt-2 text-sm text-slate-500">Deducted from worker earnings. Default: 2%</p>
                  <div className="mt-4 flex items-center gap-3">
                    <input type="number" value={commissionSettings.workerCommission} onChange={(e) => setCommissionSettings({ ...commissionSettings, workerCommission: Number(e.target.value) })} min="0" max="50" className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-lg font-bold" />
                    <span className="text-lg font-medium text-slate-600">%</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/30">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Example Calculation (Job Price = ₹1000)</p>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-slate-500">Employer Pays:</span> <span className="font-bold">₹{1000 + ((1000 * commissionSettings.employerCommission) / 100)}</span></div>
                  <div><span className="text-slate-500">Worker Receives:</span> <span className="font-bold text-emerald-600">₹{1000 - ((1000 * commissionSettings.workerCommission) / 100)}</span></div>
                  <div><span className="text-slate-500">Platform Commission:</span> <span className="font-bold text-amber-600">₹{((1000 * commissionSettings.employerCommission) / 100) + ((1000 * commissionSettings.workerCommission) / 100)}</span></div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={async () => { await handleSettingsSave({ preventDefault: () => {} }); await apiClient.put('/admin/settings', commissionSettings, { headers: { Authorization: `Bearer ${token}` } }); setMessage('Commission settings saved successfully.') }} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white">Save Commission Settings</button>
              </div>
            </section>
          ) : null}

          {activeTab === 'paymentsGateway' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold">Payment Gateway Settings</h3>
                <p className="text-sm text-slate-500">Enable or disable payment methods and configure Razorpay credentials.</p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Razorpay</p>
                      <p className="text-sm text-slate-500">Credit/Debit Card, Net Banking, Wallet payments</p>
                    </div>
                    <button onClick={() => setPaymentGatewaySettings({ ...paymentGatewaySettings, razorpayEnabled: !paymentGatewaySettings.razorpayEnabled })} className={`relative h-6 w-11 rounded-full transition ${paymentGatewaySettings.razorpayEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${paymentGatewaySettings.razorpayEnabled ? 'left-5.5' : 'left-0.5'}`} style={{ left: paymentGatewaySettings.razorpayEnabled ? '22px' : '2px' }} />
                    </button>
                  </div>
                  {paymentGatewaySettings.razorpayEnabled && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input value={paymentGatewaySettings.razorpayKeyId} onChange={(e) => setPaymentGatewaySettings({ ...paymentGatewaySettings, razorpayKeyId: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Razorpay Key ID" />
                      <input type="password" value={paymentGatewaySettings.razorpayKeySecret} onChange={(e) => setPaymentGatewaySettings({ ...paymentGatewaySettings, razorpayKeySecret: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Razorpay Key Secret" />
                    </div>
                  )}
                </div>
                {[
                  { key: 'upiEnabled', name: 'UPI', desc: 'Direct UPI payments' },
                  { key: 'phonepeEnabled', name: 'PhonePe', desc: 'Pay via PhonePe app' },
                  { key: 'gpayEnabled', name: 'Google Pay', desc: 'Pay via Google Pay' },
                  { key: 'paytmEnabled', name: 'Paytm', desc: 'Pay via Paytm app' },
                ].map((gateway) => (
                  <div key={gateway.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{gateway.name}</p>
                      <p className="text-sm text-slate-500">{gateway.desc}</p>
                    </div>
                    <button onClick={() => setPaymentGatewaySettings({ ...paymentGatewaySettings, [gateway.key]: !paymentGatewaySettings[gateway.key] })} className={`relative h-6 w-11 rounded-full transition ${paymentGatewaySettings[gateway.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition`} style={{ left: paymentGatewaySettings[gateway.key] ? '22px' : '2px' }} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button onClick={async () => { await apiClient.put('/admin/settings', paymentGatewaySettings, { headers: { Authorization: `Bearer ${token}` } }); setMessage('Payment gateway settings saved successfully.') }} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white">Save Gateway Settings</button>
              </div>
            </section>
          ) : null}

          {activeTab === 'bookingRules' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold">Booking Rules</h3>
                <p className="mt-1 text-sm text-slate-500">Configure booking limits, auto-cancel rules, and other platform policies.</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-700">Minimum Booking Amount (₹)</label>
                  <input type="number" value={bookingRuleSettings.minBookingAmount} onChange={(e) => setBookingRuleSettings({ ...bookingRuleSettings, minBookingAmount: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-700">Maximum Booking Amount (₹)</label>
                  <input type="number" value={bookingRuleSettings.maxBookingAmount} onChange={(e) => setBookingRuleSettings({ ...bookingRuleSettings, maxBookingAmount: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-700">Auto-Cancel After (Days)</label>
                  <input type="number" value={bookingRuleSettings.autoCancelDays} onChange={(e) => setBookingRuleSettings({ ...bookingRuleSettings, autoCancelDays: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="mt-6">
                <button onClick={async () => { await apiClient.put('/admin/settings', bookingRuleSettings, { headers: { Authorization: `Bearer ${token}` } }); setMessage('Booking rules saved successfully.') }} className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white">Save Booking Rules</button>
              </div>
            </section>
          ) : null}

          {activeTab === 'paymentRequests' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Payment Requests</h3>
                  <p className="text-sm text-slate-500">Review and manage coin purchase payment requests from employers.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={paymentRequestStatusFilter} onChange={(e) => setPaymentRequestStatusFilter(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input type="date" value={paymentRequestDateFilter} onChange={(e) => setPaymentRequestDateFilter(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={paymentRequestSearch} onChange={(e) => setPaymentRequestSearch(e.target.value)} className="w-full max-w-xs rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" placeholder="Search by name, phone, or txn ID" />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{coinRequests.filter((r) => r.status === 'pending').length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Approved</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{coinRequests.filter((r) => r.status === 'approved').length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Rejected</p>
                  <p className="mt-2 text-2xl font-semibold text-rose-600">{coinRequests.filter((r) => r.status === 'rejected').length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-600">₹{coinRequests.filter((r) => r.status === 'approved').reduce((sum, r) => sum + (r.amount || 0), 0)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {(() => {
                  const filtered = coinRequests.filter((r) => {
                    const matchesStatus = paymentRequestStatusFilter === 'all' || r.status === paymentRequestStatusFilter
                    const matchesDate = !paymentRequestDateFilter || new Date(r.createdAt).toISOString().slice(0, 10) === paymentRequestDateFilter
                    const query = paymentRequestSearch.toLowerCase()
                    const matchesSearch = !query || [r.userName, r.userEmail, r.userPhone, r.utrNumber, r.mobileNumberUsed].join(' ').toLowerCase().includes(query)
                    return matchesStatus && matchesDate && matchesSearch
                  })
                  return filtered.length ? filtered.map((request) => (
                    <div key={request._id || request.id} className={`rounded-2xl border p-4 ${request.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : request.status === 'approved' ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{request.userName || 'Unknown'}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' : request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{request.status}</span>
                          </div>
                          <p className="text-sm text-slate-500">Plan: <span className="font-medium text-slate-700">{request.packageLabel || request.packageId}</span> &mdash; ₹{request.amount} for {request.coins} coins</p>
                          <p className="text-sm text-slate-500">Email: {request.userEmail || 'N/A'} &bull; Phone: {request.userPhone || 'N/A'}</p>
                          <p className="text-sm text-slate-500">Payment Mobile: {request.mobileNumberUsed || 'N/A'} &bull; UTR: {request.utrNumber || 'N/A'}</p>
                          {request.note && <p className="text-sm text-slate-500">Note: {request.note}</p>}
                          {request.screenshotUrl ? <a href={request.screenshotUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 underline">View Screenshot</a> : <span className="text-sm text-slate-400">No screenshot</span>}
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleCoinReview(request._id || request.id, 'approved')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition">Approve</button>
                            <button onClick={() => handleCoinReview(request._id || request.id, 'rejected')} className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 transition">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No payment requests found.</p>
                })()}
              </div>
            </section>
          ) : null}

          {activeTab === 'coins' ? (
            <section className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Coin Requests</h3>
                    <p className="text-sm text-slate-500">Approve or reject manual coin purchase requests from users.</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {coinRequests.length ? coinRequests.map((request) => (
                    <div key={request._id || request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{request.userName || request.userEmail || 'Unknown user'}</p>
                          <p className="text-sm text-slate-500">Email: {request.userEmail || 'N/A'} • User ID: {request.submittedUserId || request.userId || 'N/A'}</p>
                          <p className="text-sm text-slate-500">Phone: {request.userPhone || 'N/A'} • Package: {request.packageLabel || request.packageId || 'N/A'} • Amount: ₹{request.amount}</p>
                          <p className="text-sm text-slate-500">Coins: {request.coins || 0} • UTR: {request.utrNumber || 'N/A'}</p>
                          {request.screenshotUrl ? <a href={request.screenshotUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 underline">View screenshot</a> : <span className="text-sm text-slate-400">No screenshot attached</span>}
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status: {request.status} • {new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleCoinReview(request._id || request.id, 'approved')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Approve</button>
                          <button onClick={() => handleCoinReview(request._id || request.id, 'rejected')} className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-700">Reject</button>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No coin requests pending.</p>}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Wallet Management</h3>
                    <p className="text-sm text-slate-500">Add or remove coins and update daily coin limits with admin password verification.</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <form onSubmit={handleCoinAdjustment} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-semibold text-slate-900">Adjust Coins</h4>
                    <div className="mt-3 space-y-3">
                      <input value={coinAdjustForm.userId} onChange={(event) => setCoinAdjustForm({ ...coinAdjustForm, userId: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="User ID" required />
                      <input type="number" value={coinAdjustForm.amount} onChange={(event) => setCoinAdjustForm({ ...coinAdjustForm, amount: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Amount" required />
                      <select value={coinAdjustForm.action} onChange={(event) => setCoinAdjustForm({ ...coinAdjustForm, action: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                        <option value="add">Add</option>
                        <option value="remove">Remove</option>
                      </select>
                      <input value={coinAdjustForm.reason} onChange={(event) => setCoinAdjustForm({ ...coinAdjustForm, reason: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Reason" required />
                      <input type="password" value={coinAdjustForm.adminPassword} onChange={(event) => setCoinAdjustForm({ ...coinAdjustForm, adminPassword: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Admin Password" required />
                      <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Apply</button>
                    </div>
                  </form>
                  <form onSubmit={handleCoinLimitUpdate} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-semibold text-slate-900">Daily Coin Limit</h4>
                    <div className="mt-3 space-y-3">
                      <input value={coinLimitForm.userId} onChange={(event) => setCoinLimitForm({ ...coinLimitForm, userId: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="User ID" required />
                      <input type="number" value={coinLimitForm.dailyCoinLimit} onChange={(event) => setCoinLimitForm({ ...coinLimitForm, dailyCoinLimit: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Daily Limit" required />
                      <input type="password" value={coinLimitForm.adminPassword} onChange={(event) => setCoinLimitForm({ ...coinLimitForm, adminPassword: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Admin Password" required />
                      <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Save Limit</button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Coin Settings</h3>
                    <p className="text-sm text-slate-500">Manage PhonePe, UPI, coin packages, rate, and usage rules.</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <input value={coinSettings.phonePeNumber || ''} onChange={(event) => setCoinSettings({ ...coinSettings, phonePeNumber: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="PhonePe Number" />
                  <input value={coinSettings.upiId || ''} onChange={(event) => setCoinSettings({ ...coinSettings, upiId: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="UPI ID" />
                  <input value={coinSettings.qrCodeUrl || ''} onChange={(event) => setCoinSettings({ ...coinSettings, qrCodeUrl: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="QR Code URL" />
                  <input type="number" value={coinSettings.coinRate || 1} onChange={(event) => setCoinSettings({ ...coinSettings, coinRate: Number(event.target.value) })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Coin Rate" />
                  <input type="password" value={coinSettings.adminPassword || ''} onChange={(event) => setCoinSettings({ ...coinSettings, adminPassword: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Admin Password" />
                  <input type="number" value={coinSettings.usageRules?.jobPostCoins || 50} onChange={(event) => setCoinSettings({ ...coinSettings, usageRules: { ...coinSettings.usageRules, jobPostCoins: Number(event.target.value) } })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Job Post Coins" />
                  <input type="number" value={coinSettings.usageRules?.featuredJobCoins || 10} onChange={(event) => setCoinSettings({ ...coinSettings, usageRules: { ...coinSettings.usageRules, featuredJobCoins: Number(event.target.value) } })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Featured Job Coins" />
                  <input type="number" value={coinSettings.usageRules?.premiumEmployerCoins || 100} onChange={(event) => setCoinSettings({ ...coinSettings, usageRules: { ...coinSettings.usageRules, premiumEmployerCoins: Number(event.target.value) } })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Premium Employer Coins" />
                  <input type="number" value={coinSettings.usageRules?.advertisementCoins || 200} onChange={(event) => setCoinSettings({ ...coinSettings, usageRules: { ...coinSettings.usageRules, advertisementCoins: Number(event.target.value) } })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Advertisement Coins" />
                  <button onClick={handleCoinSettingsSave} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">Save Coin Settings</button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Wallet History</h3>
                    <p className="text-sm text-slate-500">Review all coin adds, removes, and adjustments by admin.</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {coinHistory.length ? coinHistory.map((entry) => (
                    <div key={entry._id || entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{entry.reason || entry.action}</p>
                          <p className="text-slate-500">{entry.adminName || 'Admin'} • {new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-slate-700">Amount: {entry.amount} • Balance: {entry.newBalance}</div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No wallet history yet.</p>}
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default AdminPanelPage
