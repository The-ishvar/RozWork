import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  Briefcase, MapPin, Search, Filter, IndianRupee, Clock, GraduationCap,
  ChevronDown, ChevronUp, X, Plus, ExternalLink, Loader2
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { JobCardSkeleton } from '../components/ui/Skeleton'
import { EmptyJobState } from '../components/ui/EmptyState'

const categories = [
  'Driver', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mason',
  'Mechanic', 'Teacher', 'Tailor', 'Computer Operator', 'Farm Labour',
  'House Worker', 'Security Guard', 'Delivery Boy', 'Shop Helper',
]

const workTypes = ['Full Time', 'Part Time', 'Contract', 'Daily Wage', 'Temporary']

const experienceLevels = ['Fresher', '1-2 Years', '3-5 Years', '5+ Years']

const educationLevels = ['No Requirement', '10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Diploma']

const JobsPage = () => {
  const { user, token } = useAuth()
  const { t, isHindi } = useLanguage()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [posting, setPosting] = useState(false)

  const [filters, setFilters] = useState({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    workType: 'all',
    experience: 'all',
    education: 'all',
    salaryMin: '',
    salaryMax: '',
    location: searchParams.get('location') || '',
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const canCreatePosts = ['employer', 'admin', 'super_admin'].includes(user?.role)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/jobs')
      setJobs(data.jobs || [])
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmitJob = async (values) => {
    if (!canCreatePosts) return
    setPosting(true)
    try {
      await client.post('/jobs', {
        ...values,
        title: values.title?.trim(),
        category: values.category || values.title?.trim() || 'Other',
        location: values.location?.trim(),
        salary: values.salary?.trim() || `₹${values.price}/day`,
        price: Number(values.price || 0),
        description: values.description?.trim(),
        experienceRequired: values.experienceRequired?.trim(),
        contactNumber: values.contactNumber?.trim(),
        workType: values.workType || 'Full Time',
        postedByRole: user?.role || 'employer',
      })
      toast.success('Posted!', isHindi ? 'Job सफलतापूर्वक post हो गई' : 'Job posted successfully')
      reset()
      setShowPostForm(false)
      fetchJobs()
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Job post नहीं हो सकी')
    } finally {
      setPosting(false)
    }
  }

  const handleApply = async (job) => {
    if (!user) { navigate('/login'); return }
    try {
      await client.post(`/jobs/${job._id || job.id}/apply`)
      toast.success('Applied!', isHindi ? 'Application भेज दी गई' : 'Application submitted')
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Apply नहीं हो सका')
    }
  }

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '', category: 'all', workType: 'all', experience: 'all',
      education: 'all', salaryMin: '', salaryMax: '', location: '',
    })
  }

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'search' || key === 'salaryMin' || key === 'salaryMax' || key === 'location') return !!val
    return val !== 'all'
  }).length

  const filteredJobs = jobs.filter((job) => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!`${job.title} ${job.category} ${job.description} ${job.location}`.toLowerCase().includes(q)) return false
    }
    if (filters.category !== 'all' && job.category?.toLowerCase() !== filters.category.toLowerCase()) return false
    if (filters.workType !== 'all' && job.workType?.toLowerCase() !== filters.workType.toLowerCase()) return false
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (filters.salaryMin) {
      const salary = parseInt(String(job.price || job.salary || '0').replace(/[^0-9]/g, ''))
      if (salary < Number(filters.salaryMin)) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isHindi ? 'नौकरी खोजें' : 'Find Jobs'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filteredJobs.length} {isHindi ? 'नौकरियाँ उपलब्ध' : 'jobs available'}
            </p>
          </div>
          {canCreatePosts && (
            <Button
              onClick={() => setShowPostForm(!showPostForm)}
              icon={showPostForm ? X : Plus}
            >
              {isHindi ? 'नई Job Post करें' : 'Post New Job'}
            </Button>
          )}
        </div>

        {/* Post Job Form */}
        {showPostForm && canCreatePosts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="card-standard p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isHindi ? 'नई Job Post करें' : 'Post a New Job'}
              </h2>
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmitJob)}>
                <input className="input-field" placeholder={isHindi ? 'Job का शीर्षक *' : 'Job Title *'} {...register('title', { required: true })} />
                <select className="input-field" {...register('category')}>
                  <option value="">{isHindi ? 'श्रेणी चुनें' : 'Select category'}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="input-field" placeholder={isHindi ? 'स्थान' : 'Location'} {...register('location')} />
                <input className="input-field" placeholder={isHindi ? 'वेतन (जैसे ₹500/day)' : 'Salary (e.g. ₹500/day)'} {...register('salary')} />
                <select className="input-field" {...register('workType')}>
                  {workTypes.map((wt) => <option key={wt} value={wt}>{wt}</option>)}
                </select>
                <input className="input-field" placeholder={isHindi ? 'संपर्क नंबर' : 'Contact Number'} {...register('contactNumber')} />
                <input className="input-field" placeholder={isHindi ? 'अनुभव' : 'Experience Required'} {...register('experienceRequired')} />
                <input className="input-field" placeholder={isHindi ? 'शिक्षा' : 'Education Required'} {...register('educationRequired')} />
                <textarea className="input-field sm:col-span-2" placeholder={isHindi ? 'विवरण *' : 'Description *'} rows={3} {...register('description', { required: true })} />
                <div className="sm:col-span-2 flex gap-3">
                  <Button type="submit" loading={posting}>{isHindi ? 'Post करें' : 'Post Job'}</Button>
                  <Button variant="ghost" onClick={() => setShowPostForm(false)} type="button">{isHindi ? 'रद्द करें' : 'Cancel'}</Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Search & Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder={isHindi ? 'नौकरी खोजें...' : 'Search jobs...'}
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-standard p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isHindi ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="input-field !py-2.5 text-sm"
                  >
                    <option value="all">{isHindi ? 'सभी श्रेणियाँ' : 'All Categories'}</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isHindi ? 'काम का प्रकार' : 'Work Type'}
                  </label>
                  <select
                    value={filters.workType}
                    onChange={(e) => updateFilter('workType', e.target.value)}
                    className="input-field !py-2.5 text-sm"
                  >
                    <option value="all">{isHindi ? 'सभी प्रकार' : 'All Types'}</option>
                    {workTypes.map((wt) => <option key={wt} value={wt}>{wt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isHindi ? 'अनुभव' : 'Experience'}
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) => updateFilter('experience', e.target.value)}
                    className="input-field !py-2.5 text-sm"
                  >
                    <option value="all">{isHindi ? 'कोई भी' : 'Any'}</option>
                    {experienceLevels.map((el) => <option key={el} value={el}>{el}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isHindi ? 'स्थान' : 'Location'}
                  </label>
                  <input
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    placeholder={isHindi ? 'शहर/गाँव' : 'City/Village'}
                    className="input-field !py-2.5 text-sm"
                  />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600"
                  >
                    <X className="h-3 w-3" /> Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Jobs List */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <>
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <motion.div
                key={job._id || job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-standard"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/jobs/${job._id || job.id}`}
                          className="text-lg font-bold text-slate-900 hover:text-brand-500 transition-colors dark:text-slate-100"
                        >
                          {job.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {job.category && <Badge variant="brand" size="sm">{job.category}</Badge>}
                          {job.workType && <Badge variant="accent" size="sm">{job.workType}</Badge>}
                          {job.salary && <Badge variant="success" size="sm">{job.salary}</Badge>}
                        </div>
                      </div>
                    </div>
                    {job.description && (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{job.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {job.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                      )}
                      {job.experienceRequired && (
                        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{job.experienceRequired}</span>
                      )}
                      {job.duration && (
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.duration}</span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleApply(job)}>
                        {isHindi ? 'Apply करें' : 'Apply Now'}
                      </Button>
                      <Link to={`/jobs/${job._id || job.id}`}>
                        <Button variant="outline" size="sm" icon={ExternalLink}>
                          {isHindi ? 'विवरण' : 'Details'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <EmptyJobState onPost={canCreatePosts ? () => setShowPostForm(true) : undefined} />
          )}
        </div>
      </div>
    </div>
  )
}

export default JobsPage
