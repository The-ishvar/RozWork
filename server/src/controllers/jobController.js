import Job from '../models/Job.js'
import Notification from '../models/Notification.js'

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

const serializeJob = (job) => ({
  id: job._id ? job._id.toString() : job.id,
  title: job.title,
  category: job.category,
  location: job.location,
  salary: job.salary,
  description: job.description,
  postedBy: job.postedBy ? job.postedBy.toString() : '',
  postedByRole: job.postedByRole || 'employer',
  status: job.status,
  goalTags: getGoalTags(job),
  applicants: (job.applicants || []).map((applicant) => applicant.toString()),
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
})

export const listJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean()
    const query = (req.query.q || '').toLowerCase()
    const category = (req.query.category || '').toLowerCase()
    const goal = normalizeGoal(req.query.goal)

    const filtered = jobs.filter((job) => {
      const matchesQuery = !query || [job.title, job.category, job.location, job.description].join(' ').toLowerCase().includes(query)
      const matchesCategory = !category || String(job.category || '').toLowerCase().includes(category)
      const matchesGoal = !goal || matchesGoalFilter(job, goal)
      return matchesQuery && matchesCategory && matchesGoal
    })

    return res.json({ jobs: filtered.map(serializeJob) })
  } catch (error) {
    console.error('jobs.list failed', error)
    next(error)
  }
}

export const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      title: req.body.title?.trim(),
      category: req.body.category?.trim(),
      location: req.body.location?.trim(),
      salary: req.body.salary?.trim(),
      description: req.body.description?.trim(),
      postedBy: req.user?.id || req.body.postedBy || '',
      postedByRole: req.user?.role || req.body.postedByRole || 'employer',
      status: req.body.status || 'approved',
      goalTags: Array.isArray(req.body.goalTags) ? req.body.goalTags : [],
    })
    return res.status(201).json({ job: serializeJob(job) })
  } catch (error) {
    console.error('jobs.create failed', error)
    next(error)
  }
}

export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    return res.json({ job: serializeJob(job) })
  } catch (error) {
    console.error('jobs.getById failed', error)
    next(error)
  }
}

export const updateJob = async (req, res, next) => {
  try {
    const existingJob = await Job.findById(req.params.id)
    if (!existingJob) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const job = await Job.findByIdAndUpdate(req.params.id, {
      ...req.body,
      title: req.body.title?.trim(),
      category: req.body.category?.trim(),
      location: req.body.location?.trim(),
      salary: req.body.salary?.trim(),
      description: req.body.description?.trim(),
    }, { new: true, runValidators: true })

    return res.json({ job: serializeJob(job) })
  } catch (error) {
    console.error('jobs.update failed', error)
    next(error)
  }
}

export const deleteJob = async (req, res, next) => {
  try {
    const existingJob = await Job.findById(req.params.id)
    if (!existingJob) {
      return res.status(404).json({ message: 'Job not found' })
    }

    await Job.findByIdAndDelete(req.params.id)
    return res.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('jobs.delete failed', error)
    next(error)
  }
}

export const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    if (!job.applicants.includes(req.user.id)) {
      job.applicants.push(req.user.id)
      await job.save()
    }

    await Notification.create({
      userId: job.postedBy,
      type: 'application',
      title: 'New application',
      message: `A new application was submitted for ${job.title}.`,
    })

    return res.status(201).json({ application: { jobId: job._id.toString(), userId: req.user.id, status: 'pending' } })
  } catch (error) {
    console.error('jobs.apply failed', error)
    next(error)
  }
}

export const getApplications = async (req, res, next) => {
  try {
    const jobs = await Job.find({ applicants: req.user.id }).sort({ createdAt: -1 })
    const applications = jobs.map((job) => ({
      id: job._id.toString(),
      jobId: job._id.toString(),
      title: job.title,
      note: `Application submitted for ${job.title}`,
      createdAt: job.createdAt,
      status: 'pending',
    }))
    return res.json({ applications })
  } catch (error) {
    console.error('jobs.getApplications failed', error)
    next(error)
  }
}

export default { listJobs, createJob, getJobById, updateJob, deleteJob, applyToJob, getApplications }
