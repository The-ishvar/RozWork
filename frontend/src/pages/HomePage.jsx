import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, MapPin, ArrowRight, Briefcase, Users, Star, TrendingUp,
  Building2, Sprout, Clock, Truck, Wrench, Home, Hammer, GraduationCap,
  Shirt, Monitor, ShoppingBag, Cog, ShieldCheck, ChevronRight, Zap,
  IndianRupee, Bookmark, Share2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { JobCardSkeleton, WorkerCardSkeleton } from '../components/ui/Skeleton'

const jobCategories = [
  { label: 'Driver', labelHi: 'चालक', value: 'Driver', icon: Truck, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Electrician', labelHi: 'बिजली मिस्त्री', value: 'Electrician', icon: Zap, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { label: 'Plumber', labelHi: 'प्लंबर', value: 'Plumber', icon: Wrench, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { label: 'Carpenter', labelHi: 'बढ़ई', value: 'Carpenter', icon: Hammer, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { label: 'Painter', labelHi: 'पेंटर', value: 'Painter', icon: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ), color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { label: 'Mason', labelHi: 'मिस्त्री', value: 'Mason', icon: Building2, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
  { label: 'Mechanic', labelHi: 'मैकेनिक', value: 'Mechanic', icon: Cog, color: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  { label: 'Teacher', labelHi: 'शिक्षक', value: 'Teacher', icon: GraduationCap, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { label: 'Farm Labour', labelHi: 'खेत मजदूर', value: 'Farm Labour', icon: Sprout, color: 'from-green-500 to-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  { label: 'Tailor', labelHi: 'दर्जी', value: 'Tailor', icon: Shirt, color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { label: 'Computer Operator', labelHi: 'कंप्यूटर ऑपरेटर', value: 'Computer Operator', icon: Monitor, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { label: 'House Worker', labelHi: 'घर कामगार', value: 'House Worker', icon: Home, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { label: 'Delivery Boy', labelHi: 'डिलीवरी बॉय', value: 'Delivery Boy', icon: Truck, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
]

const jobTypes = [
  { label: 'Government Jobs', labelHi: 'सरकारी नौकरी', value: 'government', icon: ShieldCheck, color: 'from-blue-600 to-blue-700' },
  { label: 'Private Jobs', labelHi: 'प्राइवेट नौकरी', value: 'private', icon: Building2, color: 'from-brand-500 to-brand-600' },
  { label: 'Agriculture Jobs', labelHi: 'कृषि नौकरी', value: 'agriculture', icon: Sprout, color: 'from-green-500 to-green-600' },
  { label: 'Daily Wage Jobs', labelHi: 'दैनिक मजदूरी', value: 'daily_wage', icon: Clock, color: 'from-amber-500 to-amber-600' },
  { label: 'Construction Jobs', labelHi: 'निर्माण कार्य', value: 'construction', icon: Hammer, color: 'from-orange-500 to-orange-600' },
]

const HomePage = () => {
  const { user } = useAuth()
  const { t, isHindi } = useLanguage()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, workersRes] = await Promise.all([
        client.get('/jobs').catch(() => ({ data: { jobs: [] } })),
        client.get('/workers').catch(() => ({ data: { workers: [] } })),
      ])
      setJobs(jobsRes.data.jobs || [])
      setWorkers(workersRes.data.workers || [])
    } catch {
      setJobs([])
      setWorkers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}&category=${activeCategory}`)
  }

  const filteredJobs = jobs.filter((job) => {
    if (activeCategory !== 'all' && job.category?.toLowerCase() !== activeCategory.toLowerCase()) return false
    if (searchQuery && !`${job.title} ${job.category} ${job.description}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <main className="pb-24 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-mesh-dark opacity-50" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
                <Sparkle /> {isHindi ? 'हर गाँव में रोजगार' : 'Employment in Every Village'}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {isHindi ? (
                <span>{'हर गाँव के लोगों को '}<span className="text-gradient">{'रोजगार'}</span>{' और काम से '}<span className="text-gradient">{'जोड़ने'}</span>{' वाला प्लेटफ़ॉर्म'}</span>
              ) : (
                <span>{'Connecting Every Village to '}<span className="text-gradient">{'Jobs'}</span>{' and '}<span className="text-gradient">{'Opportunities'}</span></span>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg"
            >
              {isHindi
                ? 'RozWork पर आसानी से काम खोजें और सही Worker ढूँढें। गाँव से लेकर शहर तक।'
                : 'Find work easily and hire the right workers on RozWork. From villages to cities.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              {!user ? (
                <>
                  <Link to="/register" className="btn-brand text-base px-8 py-3.5">
                    {isHindi ? 'अभी शुरू करें' : 'Get Started Free'}
                  </Link>
                  <Link to="/jobs" className="btn-outline !border-slate-600 !text-slate-300 hover:!bg-slate-800 hover:!text-white text-base px-8 py-3.5">
                    {isHindi ? 'नौकरी देखें' : 'Browse Jobs'}
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn-brand text-base px-8 py-3.5">
                  {isHindi ? 'डैशबोर्ड खोलें' : 'Open Dashboard'}
                </Link>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto"
            >
              {[
                { value: workers.length > 0 ? `${workers.length}+` : '0', label: isHindi ? 'Workers' : 'Workers' },
                { value: jobs.length > 0 ? `${jobs.length}+` : '0', label: isHindi ? 'Jobs' : 'Jobs Posted' },
                { value: `${jobCategories.length}+`, label: isHindi ? 'Categories' : 'Categories' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            onSubmit={handleSearch}
            className="mx-auto mt-12 max-w-3xl"
          >
            <div className="glass-card !bg-white/95 dark:!bg-slate-900/95 p-2 sm:p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isHindi ? 'क्या काम चाहिए? (जैसे: Electrician, Driver)' : 'What work do you need? (e.g. Electrician, Driver)'}
                    className="w-full bg-transparent py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                  />
                </div>
                <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-1 items-center gap-3 px-3">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder={isHindi ? 'कहाँ? (गाँव/शहर/जिला)' : 'Where? (Village/City/District)'}
                    className="w-full bg-transparent py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-brand !py-3.5 sm:px-8"
                >
                  <Search className="h-4 w-4" />
                  {isHindi ? 'खोजें' : 'Search'}
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Job Type Quick Links */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {jobTypes.map((type) => (
            <Link
              key={type.value}
              to={`/jobs?type=${type.value}`}
              className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <type.icon className="h-4 w-4 text-brand-500" />
              {isHindi ? type.labelHi : type.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isHindi ? 'काम की श्रेणियाँ' : 'Job Categories'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isHindi ? 'अपनी ज़रूरत के अनुसार श्रेणी चुनें' : 'Choose a category that matches your needs'}
            </p>
          </div>
          <Link to="/jobs" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors">
            {isHindi ? 'सभी देखें' : 'View All'} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
          {jobCategories.map((cat) => (
            <motion.button
              key={cat.value}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/jobs?category=${cat.value}`)}
              className={`group flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all ${
                activeCategory === cat.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-brand'
                  : 'border-slate-100 bg-white hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800'
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-lg`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                {isHindi ? cat.labelHi : cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Featured Jobs & Trending Workers */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Featured Jobs */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isHindi ? 'नवीनतम नौकरियाँ' : 'Latest Jobs'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isHindi ? 'ताज़ा अवसर जो अभी उपलब्ध हैं' : 'Fresh opportunities available now'}
                </p>
              </div>
              <Link to="/jobs" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
                {isHindi ? 'सभी देखें' : 'View All'} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <>
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                  <JobCardSkeleton />
                </>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.slice(0, 5).map((job, index) => (
                  <motion.div
                    key={job._id || job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/jobs/${job._id || job.id}`}
                      className="block rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{job.title}</h3>
                            {job.salary && (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                {job.salary}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {job.location && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                            )}
                            {job.category && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{job.category}</span>
                            )}
                            {job.workType && (
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.workType}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {isHindi ? 'अभी कोई Job उपलब्ध नहीं है। जल्द ही नई Jobs आएँगी।' : 'No jobs available right now. New listings coming soon.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trending Workers */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isHindi ? 'ट्रेंडिंग वर्कर्स' : 'Trending Workers'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isHindi ? 'आपके नज़दीक बेहतरीन पेशेवर' : 'Top professionals near you'}
                </p>
              </div>
              <Link to="/workers" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
                {isHindi ? 'सभी देखें' : 'View All'} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {loading ? (
                <>
                  <WorkerCardSkeleton />
                  <WorkerCardSkeleton />
                </>
              ) : workers.length > 0 ? (
                workers.slice(0, 6).map((worker, index) => (
                  <motion.div
                    key={worker._id || worker.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/workers/${worker._id || worker.id}`}
                      className="block rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800"
                    >
                      <div className="flex items-center gap-3">
                        {worker.photo ? (
                          <img src={worker.photo} alt={worker.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold">
                            {worker.name?.[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{worker.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {worker.profession || worker.category || 'Professional'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{typeof worker.ratings === 'number' ? worker.ratings.toFixed(1) : '4.8'}</span>
                        </div>
                      </div>
                      {worker.location && (
                        <p className="mt-2.5 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" /> {worker.location}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(worker.skills || []).slice(0, 3).map((skill, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <Users className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {isHindi ? 'अभी कोई Worker उपलब्ध नहीं है।' : 'No workers available right now.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Workers */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isHindi ? 'नज़दीकी वर्कर्स' : 'Nearby Workers'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isHindi ? 'आपके क्षेत्र में उपलब्ध वर्कर्स' : 'Workers available in your area'}
            </p>
          </div>
          <Link to="/workers" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
            {isHindi ? 'सभी देखें' : 'View All'} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {workers.slice(0, 8).map((worker, index) => (
            <Link
              key={index}
              to={`/workers/${worker._id || worker.id}`}
              className="flex shrink-0 w-48 flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {worker.photo ? (
                <img src={worker.photo} alt={worker.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-100" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xl font-bold">
                  {worker.name?.[0]}
                </div>
              )}
              <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{worker.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{worker.profession || 'Professional'}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{typeof worker.ratings === 'number' ? worker.ratings.toFixed(1) : '4.8'}</span>
              </div>
              <span className="mt-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                {worker.availability || 'Available'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isHindi ? 'हाल की नौकरियाँ' : 'Recent Jobs'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isHindi ? 'ताज़ा अवसर जो अभी उपलब्ध हैं' : 'Fresh opportunities from the marketplace'}
            </p>
          </div>
          <Link to="/jobs" className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
            {isHindi ? 'और देखें' : 'See More'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 6).map((job) => (
            <Link
              key={job._id || job.id}
              to={`/jobs/${job._id || job.id}`}
              className="rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-800"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                  {job.category}
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="rounded-lg p-1.5 text-slate-300 hover:text-brand-500 transition-colors"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-slate-100 line-clamp-2">{job.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {job.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" /> {job.location || 'India'}
                </div>
                {job.salary && (
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {job.salary}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-accent-600 p-8 sm:p-12">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              {isHindi ? 'अभी अपनी Journey शुरू करें' : 'Start Your Journey Today'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              {isHindi
                ? 'RozWork पर जुड़ें और रोज़गार या Worker खोजें। मुफ्त में शुरू करें!'
                : 'Join RozWork and find jobs or workers. It\'s free to get started!'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              {!user ? (
                <>
                  <Link to="/register" className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
                    {isHindi ? 'Register करें' : 'Register Free'}
                  </Link>
                  <Link to="/login" className="rounded-xl border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10">
                    {isHindi ? 'Login करें' : 'Login'}
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-600 shadow-lg">
                  {isHindi ? 'Dashboard खोलें' : 'Open Dashboard'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

const Sparkle = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

export default HomePage
