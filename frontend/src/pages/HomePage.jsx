import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Briefcase, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const categories = [
  { label: 'Drivers', value: 'drivers', icon: '🚚' },
  { label: 'Electricians', value: 'electricians', icon: '💡' },
  { label: 'Plumbers', value: 'plumbers', icon: '🛠️' },
  { label: 'House Helpers', value: 'house helpers', icon: '🧹' },
  { label: 'Labour', value: 'labour', icon: '👷' },
  { label: 'Students', value: 'students', icon: '🎓' },
  { label: 'Delivery Workers', value: 'delivery workers', icon: '📦' },
  { label: 'Farmers', value: 'farmers', icon: '🌾' },
]

const workerImages = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
]

const heroBackground = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80'

const HomePage = () => {
  const { user } = useAuth()
  const { isHindi, t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [workers, setWorkers] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadError, setLoadError] = useState('')
  const [dashboardStats, setDashboardStats] = useState(null)

  const ui = {
    // heroBadge: t('home.heroBadge'),
    heroTitle: t('home.heroTitle'),
    // heroText: t('home.heroText'),
    joinRozWork: t('home.joinRozWork'),
    findWork: t('home.findWork'),
    hireWorkers: t('home.hireWorkers'),
    adminPanel: t('home.adminPanel'),
    searchTitle: t('home.searchTitle'),
    searchPlaceholder: t('home.searchPlaceholder'),
    categoriesTitle: t('home.categoriesTitle'),
    categoriesSubtitle: t('home.categoriesSubtitle'),
    allCategories: t('home.allCategories'),
    featuredJobs: t('home.featuredJobs'),
    openOpportunities: t('home.openOpportunities'),
    viewAll: t('home.viewAll'),
    topWorkers: t('home.topWorkers'),
    nearbyProfessionals: t('home.nearbyProfessionals'),
    noJobs: t('home.noJobs'),
    postWork: t('home.postWork'),
    browseOpportunities: t('home.browseOpportunities'),
    seeMoreWork: t('home.seeMoreWork'),
  }

  const load = async () => {
    try {
      setLoadError('')
      const [jobsRes, workersRes] = await Promise.all([
        apiClient.get('/jobs'),
        apiClient.get('/workers'),
      ])
      setJobs(jobsRes.data.jobs || [])
      setWorkers(workersRes.data.workers || [])
      setDashboardStats({
        workers: workersRes.data.workers?.length || 0,
        totalJobs: jobsRes.data.jobs?.length || 0,
        employers: 0,
      })
    } catch (error) {
      console.error(error)
      setLoadError('We could not load the latest jobs and workers right now. Please try again soon.')
      setJobs([])
      setWorkers([])
      setDashboardStats(null)
    }
  }

  const handleGoalSelect = (selectedCategory) => {
    setActiveCategory(selectedCategory)
    setTimeout(() => {
      document.getElementById('featured-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  useEffect(() => {
    load()
  }, [])

  const getWorkerImage = (worker, index) => {
    const categoryKey = normalize(worker.category || worker.profession || '')
    const categoryImages = {
      farmer: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
      driver: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      electrician: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
      plumber: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      labour: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
    }

    if (categoryImages[categoryKey]) {
      return categoryImages[categoryKey]
    }

    return worker.photo || worker.image || workerImages[index % workerImages.length]
  }

  const normalize = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ')

  const categoryMatches = (jobCategory, selectedCategory) => {
    if (selectedCategory === 'all') return true
    const normalizedJobCategory = normalize(jobCategory)
    const normalizedSelectedCategory = normalize(selectedCategory)

    const aliases = {
      drivers: ['drivers', 'driver', 'delivery', 'transport'],
      electricians: ['electricians', 'electrical', 'electrician', 'wiring'],
      plumbers: ['plumbers', 'plumbing', 'repair'],
      'house helpers': ['house helpers', 'house helper', 'home helper', 'cleaning', 'housekeeping', 'care assistant'],
      labour: ['labour', 'labor', 'factory', 'warehouse', 'support'],
      students: ['students', 'student', 'internship', 'internships'],
      'delivery workers': ['delivery workers', 'delivery worker', 'delivery'],
      farmers: ['farmers', 'farmer', 'farm', 'agriculture'],
    }

    return (aliases[normalizedSelectedCategory] || [normalizedSelectedCategory]).some((alias) => normalizedJobCategory.includes(alias))
  }

  const matchesSearch = (value = '') => {
    const query = normalize(searchQuery)
    if (!query) return true
    return normalize(value).includes(query)
  }

  const filteredJobs = jobs.filter((job) => categoryMatches(job.category, activeCategory) && matchesSearch(`${job.title} ${job.category} ${job.location} ${job.description}`))
  const filteredWorkers = workers.filter((worker) => matchesSearch(`${worker.name} ${worker.profession} ${worker.location} ${worker.skills?.join(' ') || ''} ${worker.bio || ''}`))

  const liveStats = [
    dashboardStats?.workers ? { label: 'Verified workers', value: `${dashboardStats.workers}` } : null,
    dashboardStats?.totalJobs ? { label: 'Open jobs', value: `${dashboardStats.totalJobs}` } : null,
    { label: 'Active categories', value: `${categories.length}` },
  ].filter(Boolean)

  return (
    <main className="pb-24 md:pb-0">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(2, 6, 23, 0.84) 0%, rgba(2, 6, 23, 0.6) 45%, rgba(2, 6, 23, 0.78) 100%), url(${heroBackground})` }}
        />
        <div className="relative mx-auto max-w-7xl rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-2xl text-white">
              {/* <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-blue-100">
                <Sparkles size={16} /> {ui.heroBadge}
              </div> */}
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{ui.heroTitle}</h1>
              <p className="mt-4 max-w-xl text-base text-blue-50 sm:text-lg">{ui.heroText}</p>
              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                <Link to="/login" className="rounded-full bg-white px-4 py-2.5 font-semibold text-blue-700 transition hover:translate-y-[-1px] sm:px-5 sm:py-3">{ui.joinRozWork}</Link>
                <Link to="/jobs" className="rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10 sm:px-5 sm:py-3">{ui.findWork}</Link>
                <Link to="/workers" className="rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10 sm:px-5 sm:py-3">{ui.hireWorkers}</Link>
                {user?.role === 'super_admin' ? <Link to="/admin" className="rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10 sm:px-5 sm:py-3">{ui.adminPanel}</Link> : null}
              </div>
              {liveStats.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {liveStats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/15 bg-slate-900/40 px-3 py-3 backdrop-blur">
                      <p className="text-xl font-semibold">{item.value}</p>
                      <p className="mt-1 text-sm text-blue-100">{item.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/20 bg-slate-950/70 p-4 text-white shadow-lg backdrop-blur sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-100">
                <Search size={16} /> {ui.searchTitle}
              </div>
              <div className="mt-3 space-y-3">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:outline-none"
                  placeholder={ui.searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:outline-none"
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value)}
                >
                  <option value="all" className="text-slate-900">All categories</option>
                  <option value="drivers" className="text-slate-900">Drivers</option>
                  <option value="electricians" className="text-slate-900">Electricians</option>
                  <option value="plumbers" className="text-slate-900">Plumbers</option>
                  <option value="house helpers" className="text-slate-900">House Helpers</option>
                  <option value="labour" className="text-slate-900">Labour</option>
                  <option value="students" className="text-slate-900">Students</option>
                  <option value="delivery workers" className="text-slate-900">Delivery Workers</option>
                  <option value="farmers" className="text-slate-900">Farmers</option>
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={() => document.getElementById('featured-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
                    Search now
                  </button>
                  <button type="button" onClick={() => setActiveCategory('all')} className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white">
                    All jobs
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3 text-sm text-blue-100">
                <div className="flex items-center gap-2 font-semibold">
                  <Briefcase size={16} /> Fast access to live opportunities
                </div>
                <p className="mt-1 text-blue-50/90">Browse verified jobs and nearby workers without leaving the homepage.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loadError ? <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6 lg:px-8"><div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{loadError}</div></div> : null}

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">{ui.categoriesTitle}</p>
            <h2 className="text-2xl font-semibold text-slate-900">{ui.categoriesSubtitle}</h2>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-blue-600">{ui.viewAll}</Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => handleGoalSelect(category.value)}
              className={`rounded-2xl border p-4 text-left shadow-sm transition ${activeCategory === category.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{ui.viewAll}</span>
              </div>
              <p className="mt-3 font-semibold text-slate-900">{category.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="featured-jobs-section" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">{ui.featuredJobs}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{ui.openOpportunities}</h2>
              </div>
              <Link to="/jobs" className="text-sm font-semibold text-blue-600">{ui.viewAll}</Link>
            </div>
            <div className="mt-6 space-y-3">
              {filteredJobs.length > 0 ? filteredJobs.slice(0, 4).map((job) => (
                <div key={job.id || job._id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{job.location} • {job.category}</p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">{job.salary}</span>
                  </div>
                </div>
              )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{jobs.length === 0 ? 'No jobs are live yet. New openings will appear here as employers publish them.' : 'No jobs match this category yet. Try another filter or come back soon for fresh listings.'}</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">{ui.topWorkers}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{ui.nearbyProfessionals}</h2>
              </div>
              <Link to="/workers" className="text-sm font-semibold text-blue-600">{ui.viewAll}</Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {filteredWorkers.length > 0 ? filteredWorkers.slice(0, 4).map((worker, index) => (
                <div key={worker.id || worker.name} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <img src={getWorkerImage(worker, index)} alt={worker.name} className="h-12 w-12 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{worker.name}</p>
                      <p className="truncate text-sm text-slate-500">{worker.profession || worker.skills?.join(', ') || 'Skilled professional'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center gap-1 text-amber-500"><BadgeCheck size={14} />{worker.ratings || '4.9'}</span>
                    <span>₹{worker.price || 500}/day</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">{worker.category || worker.profession || 'General'}</span>
                    <span>{worker.completedJobs || 0} jobs</span>
                  </div>
                </div>
              )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500 sm:col-span-2">No workers are available in this category yet. Fresh verified profiles will appear here soon.</p>}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Recent jobs</p>
              <h2 className="text-2xl font-semibold text-slate-900">Fresh opportunities from the marketplace</h2>
            </div>
            <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              {ui.seeMoreWork} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobs.length > 0 ? jobs.slice(0, 6).map((job) => (
              <div key={job.id || job._id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">{job.category}</span>
                  <span className="text-sm font-semibold text-green-700">{job.salary}</span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{job.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{job.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{job.location}</span>
                  <span>Open now</span>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 md:col-span-2 xl:col-span-3">No jobs available</p>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">User dashboard access</p>
              <h2 className="text-2xl font-semibold">Stay connected to your profile, bookings, and work requests</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Open your dashboard to manage work, track bookings, and keep everything in one place.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Link to="/dashboard" className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900">Open dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="rounded-full bg-white px-5 py-3 font-semibold text-slate-900">Login</Link>
                  <Link to="/register" className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
