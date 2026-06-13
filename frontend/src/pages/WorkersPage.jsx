import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, MapPin, Sparkles } from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const goalOptions = [
  { id: 'all', labelKey: 'jobs.allWork' },
  { id: 'quick-income', labelKey: 'jobs.quickIncome' },
  { id: 'flexible-hours', labelKey: 'jobs.flexibleHours' },
  { id: 'skill-growth', labelKey: 'jobs.skillGrowth' },
]

const workerImages = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
]

const fallbackWorkers = [
  { id: 'fallback-1', name: 'Asha Patel', profession: 'Home Helper', bio: 'Experienced cleaner and home helper with flexible availability.', location: 'Mumbai, India', skills: ['Cleaning', 'Home Help', 'Packing'], ratings: 4.9, price: 500, availability: 'Available now', goalTags: ['quick-income', 'flexible-hours'] },
  { id: 'fallback-2', name: 'Ravi Kumar', profession: 'Driver', bio: 'Reliable driver with local delivery experience.', location: 'Pune, India', skills: ['Driving', 'Delivery', 'Route Planning'], ratings: 4.8, price: 700, availability: 'Available today', goalTags: ['quick-income'] },
  { id: 'fallback-3', name: 'Mukesh Sharma', profession: 'Plumber', bio: 'Skilled plumber for homes and small commercial sites.', location: 'Delhi, India', skills: ['Plumbing', 'Repairs', 'Maintenance'], ratings: 4.9, price: 900, availability: 'Open this week', goalTags: ['skill-growth', 'quick-income'] },
  { id: 'fallback-4', name: 'Neha Verma', profession: 'Event Helper', bio: 'Fast and friendly support for setup, decoration, and event logistics.', location: 'Bangalore, India', skills: ['Setup', 'Event Support', 'Packing'], ratings: 4.7, price: 650, availability: 'Fast response', goalTags: ['flexible-hours'] },
]

const getWorkerGoalTags = (worker = {}) => {
  const explicitTags = Array.isArray(worker.goalTags) ? worker.goalTags.map((tag) => String(tag).toLowerCase()) : []
  if (explicitTags.length) return explicitTags

  const haystack = `${worker.profession || ''} ${worker.bio || ''} ${worker.skills?.join(' ') || ''}`.toLowerCase()
  const matches = []

  if (/(driver|delivery|packing|helper|cleaning|labour|support|warehouse)/.test(haystack)) matches.push('quick-income')
  if (/(event|home|student|intern|flexible|support)/.test(haystack)) matches.push('flexible-hours')
  if (/(plumbing|repair|electrical|wiring|research|training|maintenance|technical|skill)/.test(haystack)) matches.push('skill-growth')

  return matches
}

const matchesGoal = (worker, selectedGoal) => {
  if (selectedGoal === 'all') return true
  return getWorkerGoalTags(worker).includes(selectedGoal)
}

const WorkersPage = () => {
  const navigate = useNavigate()
  const { user, purchaseService } = useAuth()
  const { t } = useLanguage()
  const [workers, setWorkers] = useState(fallbackWorkers)
  const [selectedGoal, setSelectedGoal] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [buyingWorkerId, setBuyingWorkerId] = useState(null)

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const { data } = await apiClient.get('/workers')
        setWorkers(data.workers?.length ? data.workers : fallbackWorkers)
      } catch (error) {
        console.error(error)
        setWorkers(fallbackWorkers)
      }
    }
    loadWorkers()
  }, [])

  const getWorkerImage = (worker, index) => worker.image || worker.photo || workerImages[index % workerImages.length]

  const handleGoalSelect = (goalId) => {
    setSelectedGoal(goalId)
    setTimeout(() => {
      document.getElementById('goal-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  const matchesSearch = (worker) => {
    const query = searchQuery.toLowerCase().trim()
    const location = locationQuery.toLowerCase().trim()
    if (!query && !location) return true

    const haystack = [worker.name, worker.profession, worker.bio, worker.location, ...(worker.skills || [])].join(' ').toLowerCase()
    const matchesQuery = !query || haystack.includes(query)
    const matchesLocation = !location || haystack.includes(location)
    return matchesQuery && matchesLocation
  }

  const handleBuyWork = async (worker) => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    setBuyingWorkerId(worker.id || worker.name)
    setPurchaseMessage('')

    try {
      const result = await purchaseService({
        workerId: worker.id || worker.name,
        workerName: worker.name,
        workerProfession: worker.profession || 'Service',
        amount: worker.price || 500,
        service: worker.profession || 'Service',
      })
      setPurchaseMessage(result?.message || 'Booking completed successfully.')
      navigate('/profile', { replace: true })
    } catch (error) {
      console.error(error)
      setPurchaseMessage(t('workers.purchaseError'))
    } finally {
      setBuyingWorkerId(null)
    }
  }

  const visibleWorkers = workers.filter((worker) => matchesGoal(worker, selectedGoal) && matchesSearch(worker))

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('workers.title')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{t('workers.heroTitle')}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder={t('workers.searchSkills')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder={t('workers.searchLocation')}
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
          />
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {visibleWorkers.length} {t('workers.matchingWorkers')}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('workers.chooseGoal')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {goalOptions.map((goal) => {
            const isActive = goal.id === selectedGoal
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleGoalSelect(goal.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {t(goal.labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      {purchaseMessage ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{purchaseMessage}</div> : null}

      <div id="goal-results" className="mt-8 grid gap-6 lg:grid-cols-2">
        {visibleWorkers.map((worker, index) => (
          <div key={worker.id || worker.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getWorkerImage(worker, index)}
                  alt={worker.name}
                  className="h-16 w-16 rounded-2xl object-cover shadow-sm"
                />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{worker.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{worker.profession || worker.bio || 'Skilled professional ready to support your next job.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600"><BadgeCheck size={16} /> {worker.ratings || '4.9'}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(worker.skills || []).slice(0, 4).map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{skill}</span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {getWorkerGoalTags(worker).map((tag) => {
                const matchingOption = goalOptions.find((option) => option.id === tag)
                return (
                  <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                    {matchingOption?.label || tag}
                  </span>
                )
              })}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{t('workers.startingFrom')}</p>
                  <p className="text-xl font-semibold text-blue-700">₹{worker.price || 500}/day</p>
                </div>
                <div className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">{worker.availability || t('workers.availableNow')}</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={16} /> {worker.location || 'Local area'}</span>
              <span className="flex items-center gap-1"><Sparkles size={16} /> Verified profile</span>
            </div>
            <button
              onClick={() => handleBuyWork(worker)}
              disabled={buyingWorkerId === (worker.id || worker.name)}
              className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {buyingWorkerId === (worker.id || worker.name) ? t('workers.processing') : t('workers.buyWork')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkersPage
