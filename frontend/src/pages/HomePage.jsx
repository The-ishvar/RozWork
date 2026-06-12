import { useEffect, useState } from 'react'
import { BadgeCheck, Building2, Sparkles, Users, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const categories = [
  { label: 'Farm Labour', value: 'farm labour' },
  { label: 'Skilled Trades', value: 'skilled trades' },
  { label: 'Drivers', value: 'drivers' },
  { label: 'House Helpers', value: 'house helpers' },
  { label: 'Students', value: 'students' },
]
const testimonials = [
  { name: 'Nadia Khan', role: 'Employer', quote: 'RozWork helped me hire a reliable team in under a day.' },
  { name: 'Aman Verma', role: 'Worker', quote: 'I found consistent gigs and connected with several local clients.' },
  { name: 'Sara Ali', role: 'Farmer', quote: 'Posting a farm job was simple and the right workers responded fast.' },
]

const faqs = [
  { question: 'How does RozWork work?', answer: 'Create a profile, browse opportunities, and connect with nearby professionals in minutes.' },
  { question: 'Can I hire workers directly?', answer: 'Yes. Employers can post work, review profiles, and start hiring from the marketplace.' },
  { question: 'Is the platform suitable for students?', answer: 'Absolutely. Students can find internships and flexible support roles quickly.' },
]

const workerImages = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
]

const fallbackWorkers = [
  { id: 'fallback-home-1', name: 'Asha Patel', profession: 'Home Helper', location: 'Mumbai, India', ratings: 4.9, price: 500, availability: 'Available now' },
  { id: 'fallback-home-2', name: 'Ravi Kumar', profession: 'Driver', location: 'Pune, India', ratings: 4.8, price: 700, availability: 'Available today' },
  { id: 'fallback-home-3', name: 'Mukesh Sharma', profession: 'Plumber', location: 'Delhi, India', ratings: 4.9, price: 900, availability: 'Open this week' },
  { id: 'fallback-home-4', name: 'Neha Verma', profession: 'Event Helper', location: 'Bangalore, India', ratings: 4.7, price: 650, availability: 'Fast response' },
]

const HomePage = () => {
  const { user } = useAuth()
  const { isHindi, t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [workers, setWorkers] = useState(fallbackWorkers)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadError, setLoadError] = useState('')
  const [dashboardStats, setDashboardStats] = useState(null)

  const ui = {
    heroBadge: t('home.heroBadge'),
    heroTitle: t('home.heroTitle'),
    heroText: t('home.heroText'),
    exploreJobs: t('home.exploreJobs'),
    joinRozWork: t('home.joinRozWork'),
    findWork: t('home.findWork'),
    hireWorkers: t('home.hireWorkers'),
    createAccount: t('home.createAccount'),
    adminPanel: t('home.adminPanel'),
    searchTitle: t('home.searchTitle'),
    searchPlaceholder: t('home.searchPlaceholder'),
    categoriesTitle: t('home.categoriesTitle'),
    categoriesSubtitle: t('home.categoriesSubtitle'),
    allCategories: t('home.allCategories'),
    allCategoriesDesc: t('home.allCategoriesDesc'),
    categoryDesc: t('home.categoryDesc'),
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
      const [jobsRes, workersRes, statsRes] = await Promise.all([
        apiClient.get('/jobs'),
        apiClient.get('/workers'),
        apiClient.get('/admin/stats'),
      ])
      setJobs(jobsRes.data.jobs || [])
      setWorkers(workersRes.data.workers?.length ? workersRes.data.workers : fallbackWorkers)
      setDashboardStats(statsRes.data?.stats || null)
    } catch (error) {
      console.error(error)
      setLoadError('The live marketplace is temporarily unavailable. Please start the backend server to load real opportunities.')
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

  const getWorkerImage = (worker, index) => worker.image || worker.photo || workerImages[index % workerImages.length]

  const normalize = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ')

  const categoryMatches = (jobCategory, selectedCategory) => {
    if (selectedCategory === 'all') return true
    const normalizedJobCategory = normalize(jobCategory)
    const normalizedSelectedCategory = normalize(selectedCategory)

    const aliases = {
      'farm labour': ['farm labour', 'farm work', 'farming', 'agriculture'],
      'skilled trades': ['skilled trades', 'plumbing', 'electrical', 'carpentry', 'construction'],
      'drivers': ['drivers', 'driver', 'delivery', 'transport'],
      'house helpers': ['house helpers', 'house helper', 'home helper', 'cleaning', 'housekeeping', 'care assistant'],
      'students': ['students', 'student', 'internship', 'internships'],
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

  const heroStats = [
    { label: 'Verified workers', value: dashboardStats?.workers ? `${dashboardStats.workers}+` : '12k+' },
    { label: 'Jobs posted', value: dashboardStats?.totalJobs ? `${dashboardStats.totalJobs}` : '4.8k' },
    { label: 'Happy employers', value: dashboardStats?.employers ? `${dashboardStats.employers}` : '96%' },
  ]

  return (
    <main>
      <section className="overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
              <Sparkles size={16} /> {ui.heroBadge}
            </div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{ui.heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-base text-blue-50 sm:text-lg">{ui.heroText}</p>
            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
              <Link to="/login" className="rounded-full bg-white px-4 py-2.5 font-semibold text-blue-700 sm:px-5 sm:py-3">{ui.joinRozWork}</Link>
              <Link to="/jobs" className="rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white sm:px-5 sm:py-3">{ui.findWork}</Link>
              <Link to="/workers" className="rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white sm:px-5 sm:py-3">{ui.hireWorkers}</Link>
              {user?.role === 'super_admin' ? <Link to="/admin" className="rounded-full border border-white/30 px-4 py-2.5 font-semibold text-white sm:px-5 sm:py-3">{ui.adminPanel}</Link> : null}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur">
                  <p className="text-xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-blue-100">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur sm:p-5">
            <div className="rounded-2xl bg-white p-4 text-slate-900 sm:p-5">
              <h2 className="text-xl font-semibold sm:text-2xl">{ui.searchTitle}</h2>
              <div className="mt-3 space-y-3">
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder={ui.searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="farm labour">Farm labour</option>
                  <option value="skilled trades">Skilled trades</option>
                  <option value="drivers">Drivers</option>
                  <option value="house helpers">House helpers</option>
                  <option value="students">Student internships</option>
                </select>
                <button type="button" className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white">Search now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{ui.categoriesTitle}</p>
            <h2 className="text-3xl font-semibold text-slate-900">{ui.categoriesSubtitle}</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => handleGoalSelect('drivers')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50"
          >
            <p className="font-semibold text-slate-900">{isHindi ? 'तेज़ कमाई' : 'Quick income'}</p>
            <p className="mt-2 text-sm text-slate-500">{isHindi ? 'ड्राइवर, हेल्पर और डिलीवरी काम देखें।' : 'See driver, helper, and delivery work.'}</p>
          </button>
          <button
            type="button"
            onClick={() => handleGoalSelect('students')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50"
          >
            <p className="font-semibold text-slate-900">{isHindi ? 'लचीली शेड्यूल' : 'Flexible hours'}</p>
            <p className="mt-2 text-sm text-slate-500">{isHindi ? 'छात्रों और पार्ट-टाइम काम के लिए उपयुक्त विकल्प।' : 'Great for students and part-time support roles.'}</p>
          </button>
          <button
            type="button"
            onClick={() => handleGoalSelect('skilled trades')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-500 hover:bg-blue-50"
          >
            <p className="font-semibold text-slate-900">{isHindi ? 'कौशल बढ़ाएँ' : 'Skill growth'}</p>
            <p className="mt-2 text-sm text-slate-500">{isHindi ? 'प्लंबर, इलेक्ट्रिशियन और तकनीकी काम की सूची देखें।' : 'Explore plumbing, electrical, and technical work.'}</p>
          </button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${activeCategory === 'all' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
          >
            <p className="font-semibold text-slate-900">{ui.allCategories}</p>
            <p className="mt-2 text-sm text-slate-500">{ui.allCategoriesDesc}</p>
          </button>
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition ${activeCategory === category.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
            >
              <p className="font-semibold text-slate-900">{category.label}</p>
              <p className="mt-2 text-sm text-slate-500">{ui.categoryDesc}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="featured-jobs-section" className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{ui.featuredJobs}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{ui.openOpportunities}</h2>
              </div>
              <Link to="/jobs" className="text-sm font-semibold text-blue-600">{ui.viewAll}</Link>
            </div>
            <div className="mt-6 space-y-4">
              {(() => {
                const visibleJobs = filteredJobs

                const emptyStateMessage = jobs.length === 0 ? t('common.noJobsAvailable') : ui.noJobs

                return visibleJobs.length > 0 ? visibleJobs.slice(0, 3).map((job) => (
                  <div key={job.id || job._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="text-sm text-slate-500">{job.location} • {job.category}</p>
                      </div>
                      <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">{job.salary}</span>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500">{emptyStateMessage}</p>
              })()}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{ui.topWorkers}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{ui.nearbyProfessionals}</h2>
              </div>
              <Link to="/workers" className="text-sm font-semibold text-blue-600">{ui.viewAll}</Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {filteredWorkers.length > 0 ? filteredWorkers.slice(0, 10).map((worker, index) => (
                <div key={worker.id || worker.name} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getWorkerImage(worker, index)}
                        alt={worker.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{worker.name}</p>
                        <p className="text-sm text-slate-500">{worker.profession || worker.skills?.join(', ') || 'Skilled professional'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-amber-500"><BadgeCheck size={16} /> {worker.ratings || '4.9'}</div>
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-700">Starting from</p>
                    <p className="mt-1 text-lg font-semibold text-blue-700">₹{worker.price || 500}/day</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>{worker.location || 'Local area'}</span>
                    <span>{worker.availability || 'Available now'}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">Worker profiles will appear here once accounts are created.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Add work</p>
              <h2 className="text-2xl font-semibold text-slate-900">Publish a new opportunity in seconds</h2>
              <p className="mt-2 text-sm text-slate-500">Post a job, share the price, and let nearby workers discover it right away.</p>
            </div>
            <Link to="/jobs" className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white">{ui.postWork}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">More features</p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Built for fast hiring, trusted work, and smooth local growth</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-500 dark:text-slate-400">RozWork keeps job posting, profile building, worker discovery, and admin oversight in one simple workspace.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Verified profiles</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Each worker and employer profile is easy to review before you connect.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Flexible job posting</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Post paid tasks in minutes and get local talent responding faster.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">All-in-one dashboard</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Track your profile updates, admin tools, and open opportunities from one place.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <div className="grid gap-3 md:grid-cols-3">
          {heroStats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-3xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-10">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm dark:border-blue-900/40 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">How RozWork works</p>
              <h2 className="text-3xl font-semibold text-slate-900">Create a profile, post work, or apply in minutes</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white">Get started</Link>
              <Link to="/jobs" className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">{ui.browseOpportunities}</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5">
              <Building2 className="text-blue-600" />
              <h3 className="mt-3 font-semibold text-slate-900">Post work</h3>
              <p className="mt-2 text-sm text-slate-500">Employers and farmers can publish paid work for local talent.</p>
            </div>
            <div className="rounded-2xl bg-white p-5">
              <Users className="text-blue-600" />
              <h3 className="mt-3 font-semibold text-slate-900">Find talent</h3>
              <p className="mt-2 text-sm text-slate-500">Workers can filter nearby specialists by skill, rating, and location.</p>
            </div>
            <div className="rounded-2xl bg-white p-5">
              <Wallet className="text-blue-600" />
              <h3 className="mt-3 font-semibold text-slate-900">Secure payments</h3>
              <p className="mt-2 text-sm text-slate-500">Track payouts, bookings, and payment history in a single dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">10 fresh works</p>
              <h2 className="text-2xl font-semibold text-slate-900">Browse the latest work opportunities nearby</h2>
            </div>
            <Link to="/jobs" className="text-sm font-semibold text-blue-600">{ui.seeMoreWork}</Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobs.length > 0 ? jobs.slice(0, 6).map((job) => (
              <div key={job.id || job._id} className="rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{job.category}</span>
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

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Testimonials</p>
              <h2 className="text-2xl font-semibold text-slate-900">Trusted by employers, workers, and local teams</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-500">Real stories from people who use RozWork to find work, hire talent, and grow faster.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">“{testimonial.quote}”</p>
                <div className="mt-4">
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Everything you need to know before you begin</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{faq.question}</p>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Contact</p>
            <h2 className="mt-2 text-2xl font-semibold">Need help or want to partner with RozWork?</h2>
            <p className="mt-4 text-sm text-slate-300">Reach out at hello@rozwork.com for support, onboarding, or business partnerships.</p>
            <div className="mt-6 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Fast onboarding for employers and workers</div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Dedicated support for large teams and recurring jobs</div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Flexible plans for local and remote hiring</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-10 text-slate-300 sm:px-6 lg:px-8 dark:border-slate-700">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">RozWork</p>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Hire trusted workers, book local help, and grow your work with one streamlined platform.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/jobs" className="hover:text-white">Jobs</Link>
            <Link to="/workers" className="hover:text-white">Workers</Link>
            <Link to="/register" className="hover:text-white">Create account</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default HomePage
