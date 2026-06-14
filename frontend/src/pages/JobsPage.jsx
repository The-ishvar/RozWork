import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Briefcase, MapPin, Sparkles } from 'lucide-react'

const serviceCategoryOptions = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Driver', 'Delivery Boy', 'Farmer', 'Labour', 'House Helper', 'Cleaner', 'Mechanic', 'AC Repair', 'Mobile Repair', 'Computer Repair', 'Tutor', 'Freelancer', 'Other']
const workTypeOptions = ['Full Time', 'Part Time', 'Daily Wage', 'Contract', 'Temporary']
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const goalOptions = [
  { id: 'all', labelKey: 'jobs.allWork' },
  { id: 'quick-income', labelKey: 'jobs.quickIncome' },
  { id: 'flexible-hours', labelKey: 'jobs.flexibleHours' },
  { id: 'skill-growth', labelKey: 'jobs.skillGrowth' },
]

const getJobGoalTags = (job = {}) => {
  const explicitTags = Array.isArray(job.goalTags) ? job.goalTags.map((tag) => String(tag).toLowerCase()) : []
  if (explicitTags.length) return explicitTags

  const haystack = `${job.title || ''} ${job.category || ''} ${job.description || ''}`.toLowerCase()
  const matches = []

  if (/(delivery|packing|warehouse|driver|helper|cleaning|labour|farm|support|load)/.test(haystack)) {
    matches.push('quick-income')
  }
  if (/(student|intern|event|home|farm|support|assistant|flexible)/.test(haystack)) {
    matches.push('flexible-hours')
  }
  if (/(plumbing|repair|electrical|wiring|research|internship|training|maintenance|technical|skill)/.test(haystack)) {
    matches.push('skill-growth')
  }

  return matches
}

const matchesGoal = (job, selectedGoal) => {
  if (selectedGoal === 'all') return true
  return getJobGoalTags(job).includes(selectedGoal)
}

const JobsPage = () => {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [selectedGoal, setSelectedGoal] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { register, handleSubmit, reset } = useForm({ defaultValues: { workType: 'Full Time', category: '' } })

  const loadJobs = async () => {
    const { data } = await apiClient.get('/jobs')
    setJobs(data.jobs || [])
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const onSubmit = async (values) => {
    await apiClient.post('/jobs', {
      ...values,
      title: values.title?.trim(),
      category: values.category?.trim(),
      location: values.location?.trim(),
      salary: values.salary?.trim() || values.price?.trim() || values.budget?.trim() || '',
      price: Number(values.price || values.salary || values.budget || 0),
      budget: values.budget?.trim() || values.price?.trim() || values.salary?.trim() || '',
      jobDate: values.jobDate?.trim() || '',
      duration: values.duration?.trim() || '',
      description: values.description?.trim(),
      experienceRequired: values.experienceRequired?.trim(),
      contactNumber: values.contactNumber?.trim(),
      workType: values.workType?.trim() || 'Full Time',
      postedByRole: user?.role || 'employer',
    }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    reset({ workType: 'Full Time', category: '' })
    await loadJobs()
  }

  const handleGoalSelect = (goalId) => {
    setSelectedGoal(goalId)
    setTimeout(() => {
      document.getElementById('goal-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  const matchesSearch = (job) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return [job.title, job.category, job.location, job.description].join(' ').toLowerCase().includes(query)
  }

  const applyToJob = async (jobId) => {
    await apiClient.post(`/jobs/${jobId}/apply`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('rozwork_token')}` },
    })
    alert(t('jobs.applicationSubmitted'))
  }

  const visibleJobs = jobs.filter((job) => matchesGoal(job, selectedGoal) && matchesSearch(job))

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('jobs.title')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{t('jobs.heroTitle')}</h1>
          </div>
          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">{t('jobs.heroBadge')}</div>
        </div>
      </div>

      {user ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('jobs.postJob')}</h2>
          </div>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.jobTitle', 'Job Title')} {...register('title', { required: true })} />
            <select className="rounded-xl border border-slate-200 px-4 py-3" {...register('category', { required: true })}>
              <option value="">{t('jobs.category', 'Select category')}</option>
              {serviceCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.location', 'Location')} {...register('location', { required: true })} />
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.price', 'Budget / Price')} {...register('price')} />
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.budget', 'Budget label')} {...register('budget')} />
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.jobDate', 'Preferred date')} type="date" {...register('jobDate')} />
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.duration', 'Duration')} {...register('duration')} />
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.experience', 'Experience required')} {...register('experienceRequired')} />
            <input className="rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.contact', 'Contact number')} {...register('contactNumber')} />
            <select className="rounded-xl border border-slate-200 px-4 py-3" {...register('workType')}>
              {workTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3" placeholder={t('jobs.description', 'Description')} rows="4" {...register('description', { required: true })} />
            <button className="md:col-span-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white">{t('jobs.publishJob', 'Publish job')}</button>
          </form>
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('jobs.chooseGoal')}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{t('jobs.chooseGoalSubtitle')}</h3>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
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
        <p className="mt-3 text-sm text-slate-500">{t('jobs.filtersHint')}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3"
            placeholder={t('jobs.searchPlaceholder')}
          />
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {visibleJobs.length} {t('jobs.matchingJobs')}
          </div>
        </div>
      </div>

      <div id="goal-results" className="mt-10 grid gap-6 lg:grid-cols-2">
        {visibleJobs.map((job) => (
          <div key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Briefcase size={16} /> {job.category}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{job.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{job.description}</p>
              </div>
              <div className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">₹{job.price || job.salary || 0}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {getJobGoalTags(job).map((tag) => {
                const matchingOption = goalOptions.find((option) => option.id === tag)
                return (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {matchingOption?.label || tag}
                  </span>
                )
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
              <span className="flex items-center gap-1"><Sparkles size={16} /> {job.category}</span>
              {job.jobDate ? <span>{job.jobDate}</span> : null}
              {job.duration ? <span>{job.duration}</span> : null}
            </div>
            <button onClick={() => applyToJob(job.id)} className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t('jobs.applyNow')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default JobsPage
