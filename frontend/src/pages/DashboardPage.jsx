import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Briefcase, CheckCircle2, ShieldCheck, Sparkles, UserRound, Wallet, CreditCard, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react'
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
  const [recentTransactions, setRecentTransactions] = useState([])
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
      setRecentTransactions(statsRes.data?.recentTransactions || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || !token) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        { label: 'Wallet Balance', value: `₹${stats.walletBalance || 0}`, icon: Wallet, color: 'emerald' },
        { label: 'Total Earnings', value: `₹${stats.totalEarnings || 0}`, icon: TrendingUp, color: 'blue' },
        { label: 'Completed Jobs', value: stats.totalCompletedJobs || 0, icon: CheckCircle2, color: 'violet' },
        { label: 'Commission Paid', value: `₹${stats.totalCommissionPaid || 0}`, icon: CreditCard, color: 'amber' },
      ]
    }

    if (role === 'employer') {
      return [
        { label: 'Jobs Posted', value: stats.totalJobsPosted || 0, icon: Briefcase, color: 'blue' },
        { label: 'Total Spent', value: `₹${stats.totalSpentAmount || 0}`, icon: TrendingUp, color: 'violet' },
        { label: 'Completed Jobs', value: stats.completedJobs || 0, icon: CheckCircle2, color: 'emerald' },
        { label: 'Commission Paid', value: `₹${stats.totalCommissionPaid || 0}`, icon: CreditCard, color: 'amber' },
      ]
    }

    return [
      { label: 'Platform Earnings', value: `₹${stats.platformEarnings || 0}`, icon: Wallet, color: 'emerald' },
      { label: 'Bookings', value: stats.totalBookings || 0, icon: ShieldCheck, color: 'blue' },
      { label: 'Users', value: stats.totalUsers || 0, icon: UserRound, color: 'violet' },
      { label: 'Workers', value: stats.totalWorkers || 0, icon: Sparkles, color: 'amber' },
    ]
  }, [stats, user?.role])

  const employerBookings = useMemo(() => (bookings || []).filter((b) => b.employerId === user?.id || b.userId === user?.id || b.providerId === user?.id), [bookings, user?.id])
  const workerBookings = useMemo(() => (bookings || []).filter((b) => b.workerId === user?.id || b.providerId === user?.id), [bookings, user?.id])
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

  const colorMap = { emerald: 'text-emerald-600', blue: 'text-blue-600', violet: 'text-violet-600', amber: 'text-amber-600' }

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
              <div className={`flex items-center gap-2 ${colorMap[card.color] || 'text-blue-600'}`}><Icon size={18} /> {card.label}</div>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {user?.role === 'worker' && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Today&apos;s Bookings</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Upcoming and active work</h2>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{stats.todayBookings || 0} today</div>
              </div>
              <div className="mt-4 space-y-3">
                {workerBookings.filter((b) => ['pending', 'accepted', 'waiting_for_verification'].includes(b.status)).slice(0, 5).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} user={user} onAction={handleBookingAction} />
                ))}
                {workerBookings.filter((b) => ['pending', 'accepted', 'waiting_for_verification'].includes(b.status)).length === 0 && (
                  <p className="text-sm text-slate-500">No active bookings right now.</p>
                )}
              </div>
            </div>
          )}

          {user?.role === 'worker' && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Earnings & Wallet</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent payouts and wallet balance</h2>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">₹{stats.walletBalance || 0}</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total Earnings</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">₹{stats.totalEarnings || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Wallet Balance</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">₹{stats.walletBalance || 0}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {earningsHistory.length ? earningsHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <ArrowDownRight size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">₹{item.workerAmount || item.amount}</p>
                        <p className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent payout'}</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</div>
                  </div>
                )) : <p className="text-sm text-slate-500">No payout activity yet.</p>}
              </div>
            </div>
          )}

          {user?.role === 'employer' && (
            <>
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">My Bookings</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Active and recent booking requests</h2>
                  </div>
                  <div className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{employerBookings.length} bookings</div>
                </div>
                <div className="mt-6 space-y-3">
                  {employerBookings.length ? employerBookings.slice(0, 5).map((booking) => (
                    <BookingCard key={booking.id} booking={booking} user={user} onAction={handleBookingAction} />
                  )) : <p className="text-sm text-slate-500">No bookings have been created yet.</p>}
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Payment History</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent payments and commissions</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{earningsHistory.length} entries</div>
                </div>
                <div className="mt-6 space-y-3">
                  {earningsHistory.length ? earningsHistory.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <ArrowUpRight size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">₹{item.amount}</p>
                          <p className="text-xs text-slate-500">{item.paymentType} • {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No completed transactions yet.</p>}
                </div>
              </div>
            </>
          )}

          {!user?.role || user?.role === 'user' ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Platform Earnings</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Revenue and commission overview</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">₹{stats.totalRevenue || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Platform Earnings</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">₹{stats.platformEarnings || 0}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Booking Workflow</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Manage incoming requests and verification tasks</h2>
              </div>
              <Link to="/profile" className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Open profile</Link>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? <p className="text-sm text-slate-500">Loading bookings...</p> : bookings.length ? bookings.slice(0, 8).map((booking) => (
                <BookingCard key={booking.id} booking={booking} user={user} onAction={handleBookingAction} showCommission />
              )) : <p className="text-sm text-slate-500">No bookings have been created yet.</p>}
            </div>
          </div>

          <div className="space-y-6">
            {recentTransactions.length > 0 && (
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-900"><CreditCard size={18} /> Transaction History</div>
                  <div className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{recentTransactions.length} recent</div>
                </div>
                <div className="mt-6 space-y-3">
                  {recentTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.type === 'refund' ? 'bg-amber-100' : tx.type.includes('commission') ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                          {tx.type === 'refund' ? <ArrowUpRight size={14} className="text-amber-600" /> : <ArrowDownRight size={14} className="text-emerald-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tx.description || tx.type}</p>
                          <p className="text-xs text-slate-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent'}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${tx.type.includes('commission') ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {tx.type.includes('commission') ? '-' : '+'}₹{tx.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

const BookingCard = ({ booking, user, onAction, showCommission = false }) => {
  const isWorker = booking.workerId === user?.id || booking.providerId === user?.id
  const isEmployer = booking.employerId === user?.id || booking.userId === user?.id
  const canAcceptReject = isWorker && booking.status === 'pending'
  const canComplete = isWorker && booking.status === 'accepted'
  const canVerify = isEmployer && booking.status === 'waiting_for_verification'
  const canCancel = (isEmployer || isWorker) && ['pending', 'accepted'].includes(booking.status)
  const canPay = isEmployer && booking.paymentStatus === 'pending' && booking.status !== 'cancelled'

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700',
    accepted: 'bg-blue-50 text-blue-700',
    rejected: 'bg-rose-50 text-rose-700',
    waiting_for_verification: 'bg-violet-50 text-violet-700',
    verification_rejected: 'bg-orange-50 text-orange-700',
    completed: 'bg-emerald-50 text-emerald-700',
    confirmed: 'bg-blue-50 text-blue-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{booking.serviceTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{booking.category || 'Service'} • {booking.bookingDate || 'No date set'}</p>
        </div>
        <div className="flex items-center gap-2">
          {showCommission && booking.totalPlatformCommission > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">₹{booking.totalPlatformCommission} commission</span>
          )}
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[booking.status] || 'bg-slate-100 text-slate-700'}`}>{booking.status?.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
        <span>₹{booking.employerPays || booking.price || booking.amount || 0}</span>
        {booking.village && <span>{booking.village}</span>}
        {booking.paymentStatus && <span className="capitalize">{booking.paymentStatus}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {canAcceptReject && (
          <>
            <button onClick={() => onAction(booking.id, 'accept')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Accept</button>
            <button onClick={() => onAction(booking.id, 'reject')} className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
          </>
        )}
        {canComplete && <button onClick={() => onAction(booking.id, 'complete')} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Complete Work</button>}
        {canVerify && (
          <>
            <button onClick={() => onAction(booking.id, 'verify')} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Verify & Pay</button>
            <button onClick={() => onAction(booking.id, 'reject-verification')} className="rounded-full bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
          </>
        )}
        {canPay && <Link to={`/payment/${booking.id}`} className="rounded-full bg-violet-600 px-3 py-2 text-sm font-semibold text-white">Pay Now</Link>}
        {canCancel && <button onClick={() => onAction(booking.id, 'cancel')} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600">Cancel</button>}
      </div>
    </div>
  )
}

export default DashboardPage
