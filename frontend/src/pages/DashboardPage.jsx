import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Briefcase, CheckCircle2, Clock3, ShieldCheck, Sparkles, UserRound, Wallet } from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const DashboardPage = () => {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState({})
  const [notifications, setNotifications] = useState([])
  const [bookings, setBookings] = useState([])
  const [earningsHistory, setEarningsHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const profileIncomplete = Boolean(user) && (!user.name || !user.phone || !user.profession || !user.location || !user.bio || !user.skills?.length || !user.photo)

  const loadDashboard = async () => {
    if (!user || !token) return
    try {
      setLoading(true)
      const [statsRes, bookingsRes, notifsRes] = await Promise.all([
        apiClient.get('/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/notifications', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setStats(statsRes.data?.stats || {})
      setBookings(bookingsRes.data?.bookings || [])
      setNotifications(notifsRes.data?.notifications || [])
      setEarningsHistory(statsRes.data?.earningsHistory || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || !token) return

    loadDashboard()
    const intervalId = window.setInterval(() => {
      void loadDashboard()
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [user, token])

  const premiumStatus = user?.isPremium || stats.isPremium ? 'Premium active' : 'Upgrade to premium'

  const roleBasedCards = useMemo(() => {
    const role = user?.role || 'user'
    if (role === 'worker') {
      return [
        { label: 'Total earnings', value: `₹${stats.totalEarnings || 0}`, icon: Wallet },
        { label: 'Completed jobs', value: stats.totalCompletedJobs || 0, icon: CheckCircle2 },
        { label: 'Pending jobs', value: stats.pendingJobs || 0, icon: Clock3 },
        { label: 'Active jobs', value: stats.activeJobs || 0, icon: Sparkles },
      ]
    }

    if (role === 'employer') {
      return [
        { label: 'Jobs posted', value: stats.totalJobsPosted || 0, icon: Briefcase },
        { label: 'Total earnings', value: `₹${stats.totalEarnings || stats.earnings || 0}`, icon: Wallet },
        { label: 'Available balance', value: `₹${stats.earnings || stats.totalEarnings || 0}`, icon: Wallet },
        { label: 'Completed jobs', value: stats.completedJobs || 0, icon: CheckCircle2 },
      ]
    }

    return [
      { label: 'Platform earnings', value: `₹${stats.platformEarnings || 0}`, icon: Wallet },
      { label: 'Bookings', value: stats.totalBookings || 0, icon: ShieldCheck },
      { label: 'Users', value: stats.totalUsers || 0, icon: UserRound },
      { label: 'Workers', value: stats.totalWorkers || 0, icon: Sparkles },
    ]
  }, [stats, user?.role])

  const employerApplications = useMemo(() => (bookings || []).filter((booking) => booking.employerId === user?.id || booking.userId === user?.id || booking.providerId === user?.id), [bookings, user?.id])
  const unreadNotifications = (notifications || []).filter((notification) => !notification.isRead).length

  const handleBookingAction = async (bookingId, action) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      await loadDashboard()
    } catch (error) {
      console.error(error)
    }
  }

  if (!user) return <div className="px-4 py-16 text-center text-slate-500">{t('dashboard.signInPrompt')}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('dashboard.title')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t('dashboard.welcomeBack')} {user.name}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500">A professional marketplace workspace for booking management, work verification, and earnings tracking.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">{user.role} account</div>
            <div className={`rounded-full px-4 py-2 text-sm font-semibold ${user?.isPremium || stats.isPremium ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{premiumStatus}</div>
          </div>
        </div>
      </div>

      {profileIncomplete ? (
        <div className="mt-6 flex flex-col gap-3 rounded-[24px] border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
            <p className="mt-1 text-sm text-amber-700">A few more details will help you appear more trustworthy to employers and clients.</p>
          </div>
          <Link to="/profile" className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Complete Profile</Link>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roleBasedCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600"><Icon size={18} /> {card.label}</div>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {user?.role === 'worker' ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Earnings & history</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent payouts and completed work</h2>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">₹{stats.totalEarnings || 0}</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Completed work</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalCompletedJobs || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Pending actions</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.pendingJobs || 0}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {earningsHistory.length ? earningsHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">₹{item.amount}</p>
                      <p className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent payout'}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</div>
                  </div>
                )) : <p className="text-sm text-slate-500">No payout activity yet.</p>}
              </div>
            </div>
          ) : null}

          {user?.role === 'employer' ? (
            <>
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Recent applications</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Latest applicant details and booking requests</h2>
                  </div>
                  <div className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{employerApplications.length} requests</div>
                </div>
                <div className="mt-6 space-y-3">
                  {employerApplications.length ? employerApplications.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{booking.serviceTitle}</p>
                          <p className="mt-1 text-sm text-slate-500">Applicant: {booking.contactName || 'Pending review'}</p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">{booking.status || 'pending'}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>{booking.contactEmail || 'No email provided'}</span>
                        <span>₹{booking.price || booking.amount || 0}</span>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No applications have arrived yet.</p>}
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Transaction history</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent earnings and completed payments</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{earningsHistory.length} entries</div>
                </div>
                <div className="mt-6 space-y-3">
                  {earningsHistory.length ? earningsHistory.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">₹{item.amount}</p>
                        <p className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent payout'}</p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No completed transactions yet.</p>}
                </div>
              </div>
            </>
          ) : null}

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Booking workflow</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Manage incoming requests and verification tasks</h2>
              </div>
              <Link to="/profile" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Open profile</Link>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? <p className="text-sm text-slate-500">Loading bookings...</p> : bookings.length ? bookings.map((booking) => {
                const isWorker = booking.workerId === user.id || booking.providerId === user.id
                const isEmployer = booking.employerId === user.id || booking.userId === user.id
                const canAcceptReject = isWorker && booking.status === 'pending'
                const canComplete = isWorker && booking.status === 'accepted'
                const canVerify = isEmployer && booking.status === 'waiting_for_verification'

                return (
                  <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{booking.serviceTitle}</p>
                        <p className="mt-1 text-sm text-slate-500">{booking.category || 'Service'} • ₹{booking.price || booking.amount || 0}</p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">{booking.status}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canAcceptReject ? (
                        <>
                          <button onClick={() => handleBookingAction(booking.id, 'accept')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Accept booking</button>
                          <button onClick={() => handleBookingAction(booking.id, 'reject')} className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Reject booking</button>
                        </>
                      ) : null}
                      {canComplete ? <button onClick={() => handleBookingAction(booking.id, 'complete')} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Complete work</button> : null}
                      {canVerify ? (
                        <>
                          <button onClick={() => handleBookingAction(booking.id, 'verify')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Verify work</button>
                          <button onClick={() => handleBookingAction(booking.id, 'reject-verification')} className="rounded-full bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Reject verification</button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              }) : <p className="text-sm text-slate-500">No bookings have been created yet.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-900"><BellRing size={18} /> Notifications</div>
                <div className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{unreadNotifications} unread</div>
              </div>
              <div className="mt-6 space-y-3">
                {notifications.length ? notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">You are all caught up.</p>}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-blue-600 to-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Marketplace ready</p>
              <h3 className="mt-3 text-xl font-semibold">Professional booking and verification flows are now live.</h3>
              <p className="mt-3 text-sm text-blue-100">Use the dashboard to accept work, verify completion, and track earnings in one place.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
