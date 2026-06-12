import { useEffect, useState } from 'react'
import { Briefcase, BellRing, ShieldCheck, UserRound, Wallet } from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const DashboardPage = () => {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const [appsRes, notifsRes, purchasesRes] = await Promise.all([
          apiClient.get('/applications', { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get('/notifications', { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get('/purchases', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setApplications(appsRes.data.applications || [])
        setNotifications(notifsRes.data.notifications || [])
        setPurchases(purchasesRes.data.purchases || [])
      } catch (error) {
        console.error(error)
      }
    }

    load()
  }, [user, token])

  if (!user) return <div className="px-4 py-16 text-center text-slate-500">{t('dashboard.signInPrompt')}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('dashboard.title')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t('dashboard.welcomeBack')} {user.name}</h1>
          </div>
          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{user.role} account</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600"><Briefcase size={18} /> {t('dashboard.jobs')}</div>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{applications.length}</p>
          <p className="mt-2 text-sm text-slate-500">{t('dashboard.applicationsRouted')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600"><BellRing size={18} /> {t('dashboard.alerts')}</div>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{notifications.length}</p>
          <p className="mt-2 text-sm text-slate-500">{t('dashboard.notificationsActivity')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600"><ShieldCheck size={18} /> {t('dashboard.verified')}</div>
          <p className="mt-4 text-3xl font-semibold text-slate-900">100%</p>
          <p className="mt-2 text-sm text-slate-500">{t('dashboard.secureAccess')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600"><Wallet size={18} /> {t('dashboard.purchases')}</div>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{purchases.length}</p>
          <p className="mt-2 text-sm text-slate-500">{t('dashboard.bookings')}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900"><UserRound size={18} /> {t('dashboard.myApplications')}</div>
          <div className="mt-6 space-y-4">
            {applications.length > 0 ? applications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">Application #{item.id}</p>
                <p className="mt-1 text-sm text-slate-500">{item.note || t('dashboard.applicationSubmitted')}</p>
              </div>
            )) : <p className="text-sm text-slate-500">{t('dashboard.noApplications')}</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900"><BellRing size={18} /> {t('dashboard.notifications')}</div>
          <div className="mt-6 space-y-4">
            {notifications.length > 0 ? notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.type}</p>
                <p className="mt-1 text-sm text-slate-500">{item.message}</p>
              </div>
            )) : <p className="text-sm text-slate-500">{t('dashboard.noNotifications')}</p>}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900"><Wallet size={18} /> {t('dashboard.recentPurchases')}</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {purchases.length > 0 ? purchases.slice().reverse().map((purchase) => (
            <div key={purchase.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{purchase.workerName || t('dashboard.serviceBooked')}</p>
              <p className="mt-1 text-sm text-slate-500">{purchase.workerProfession || purchase.service || t('dashboard.professionalSupport')}</p>
              <p className="mt-2 text-sm font-semibold text-blue-700">₹{purchase.amount || 0}</p>
            </div>
          )) : <p className="text-sm text-slate-500">{t('dashboard.noPurchases')}</p>}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
