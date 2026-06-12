const dataService = require('../services/dataService')

const normalizeGoal = (goal) => String(goal || '').trim().toLowerCase()

const getGoalTags = (job = {}) => {
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

const matchesGoalFilter = (job, goal) => {
  if (!goal) return true
  return getGoalTags(job).includes(goal)
}

const serializeJob = (job) => ({ ...job, goalTags: getGoalTags(job) })

const listJobs = async (req, res) => {
  const jobs = await dataService.getJobs()
  const query = (req.query.q || '').toLowerCase()
  const category = (req.query.category || '').toLowerCase()
  const goal = normalizeGoal(req.query.goal)

  const filtered = jobs.filter((job) => {
    const matchesQuery = !query || [job.title, job.category, job.location, job.description].join(' ').toLowerCase().includes(query)
    const matchesCategory = !category || String(job.category || '').toLowerCase().includes(category)
    const matchesGoal = !goal || matchesGoalFilter(job, goal)
    return matchesQuery && matchesCategory && matchesGoal
  })

  const normalizedJobs = filtered.map(serializeJob)

  return res.json({ jobs: normalizedJobs })
}

const createJob = async (req, res) => {
  const job = await dataService.createJob({
    ...req.body,
    title: req.body.title?.trim(),
    category: req.body.category?.trim(),
    location: req.body.location?.trim(),
    salary: req.body.salary?.trim(),
    description: req.body.description?.trim(),
    postedBy: req.user?.id || req.body.postedBy || '',
    postedByRole: req.user?.role || req.body.postedByRole || 'employer',
    status: req.body.status || 'approved',
    createdAt: new Date().toISOString(),
  })
  return res.status(201).json({ job: serializeJob(job) })
}

const getJobById = async (req, res) => {
  const job = await dataService.getJobById(req.params.id)
  if (!job) {
    return res.status(404).json({ message: 'Job not found' })
  }

  return res.json({ job: serializeJob(job) })
}

const updateJob = async (req, res) => {
  const existingJob = await dataService.getJobById(req.params.id)
  if (!existingJob) {
    return res.status(404).json({ message: 'Job not found' })
  }

  const job = await dataService.updateJob(req.params.id, {
    ...req.body,
    title: req.body.title?.trim(),
    category: req.body.category?.trim(),
    location: req.body.location?.trim(),
    salary: req.body.salary?.trim(),
    description: req.body.description?.trim(),
  })

  return res.json({ job: serializeJob(job) })
}

const deleteJob = async (req, res) => {
  const existingJob = await dataService.getJobById(req.params.id)
  if (!existingJob) {
    return res.status(404).json({ message: 'Job not found' })
  }

  await dataService.deleteJob(req.params.id)
  return res.json({ message: 'Job deleted successfully' })
}

const applyToJob = async (req, res) => {
  const application = await dataService.createApplication({
    jobId: req.params.jobId,
    userId: req.user.id,
    note: req.body.note || '',
  })
  return res.status(201).json({ application })
}

const getApplications = async (req, res) => {
  const applications = await dataService.getApplicationsForUser(req.user.id)
  return res.json({ applications })
}

module.exports = { listJobs, createJob, getJobById, updateJob, deleteJob, applyToJob, getApplications }
