import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  BellRing,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

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
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
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

  const loadDashboard = async () => {
    if (!token) return

    try {
      setLoading(true)
      const [overviewRes, statsRes, settingsRes, notificationsRes, auditRes] = await Promise.all([
        apiClient.get('/admin/overview', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/admin/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/admin/audit', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const overview = overviewRes.data || {}
      const statsPayload = statsRes.data?.stats || {}
      setStats((previous) => ({ ...previous, ...(overview.stats || {}), ...statsPayload }))
      setUsers(overview.users || [])
      setJobs(overview.jobs || [])
      setPosts(overview.posts || [])
      setNotifications(notificationsRes.data.notifications || [])
      setActivities(overview.activities || [])
      setPendingContent(overview.pendingContent || [])
      setAuditLogs(auditRes.data.logs || overview.auditLogs || [])
      setSettings({ ...defaultSettings, ...(settingsRes.data.settings || {}) })
    } catch (error) {
      console.error(error)
      setMessage(error?.response?.data?.message || 'Unable to load the admin dashboard right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'super_admin') return <Navigate to="/profile" replace />

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:w-72">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Super admin</p>
              <h1 className="text-xl font-semibold">{user.name}</h1>
            </div>
            <div className="rounded-full bg-blue-50 p-2 text-blue-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'activity', label: 'Activity Log', icon: ShieldCheck },
              { id: 'moderation', label: 'Moderation', icon: ClipboardList },
              { id: 'content', label: 'Content', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'notifications', label: 'Notifications', icon: BellRing },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  <Icon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-900"><Menu size={16} /> Control center</div>
            <p className="mt-2">Approve new submissions, manage trusted accounts, and keep website content under review.</p>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Operations dashboard</p>
                <h2 className="mt-2 text-3xl font-semibold">Secure website control for RozWork</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">Review registrations, moderate new content, manage users, and update site settings from a single responsive panel.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => loadDashboard()} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"> <RefreshCw size={16} className="mr-2 inline" /> Refresh</button>
                <button onClick={exportUsers} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white"> <Upload size={16} className="mr-2 inline" /> Export CSV</button>
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
                      <h3 className="text-lg font-semibold">Recent activity</h3>
                      <p className="text-sm text-slate-500">Every registration, post, and admin action is logged here.</p>
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
                      <h3 className="text-lg font-semibold">Growth chart</h3>
                      <p className="text-sm text-slate-500">Last six months of signed-up users.</p>
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
            </>
          ) : null}

          {activeTab === 'users' ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">User management</h3>
                  <p className="text-sm text-slate-500">Search, edit, block, unblock, and remove accounts instantly.</p>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" placeholder="Search users" />
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
        </main>
      </div>
    </div>
  )
}

export default AdminPanelPage
