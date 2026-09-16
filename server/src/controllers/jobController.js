import Job from '../models/Job.js'
import Booking from '../models/Booking.js'
import Notification from '../models/Notification.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import Setting from '../models/Setting.js'
import CoinTransaction from '../models/CoinTransaction.js'
import { createNotification, notifyAdmins } from '../utils/notify.js'
import { recordUserActivity } from '../utils/activity.js'
import { emitPlatformEvent } from '../utils/events.js'
import { loadCoinSettings, ensureUserWallet } from '../utils/coinSystem.js'

const defaultPlatformSettings = {
  platformCommission: 5,
  applicationFee: 20,
  premiumPrice: 99,
}

const loadPlatformSettings = async () => {
  const settings = await Setting.find({}).lean()
  return { ...defaultPlatformSettings, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) }
}

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

const parseMoneyValue = (value) => {
  const cleaned = String(value ?? '').trim().replace(/[^\d.]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

const inferCategoryFromRequest = (payload = {}) => {
  const explicitCategory = String(payload.category || '').trim()
  if (explicitCategory) {
    return explicitCategory
  }

  const haystack = `${payload.title || ''} ${payload.description || ''} ${payload.workType || ''}`.toLowerCase()
  if (/(electric|electrical|wiring|fan|switch)/.test(haystack)) {
    return 'Electrician'
  }
  if (/(plumb|pipe|tap|water|drain)/.test(haystack)) {
    return 'Plumber'
  }
  if (/(carpenter|wood|furniture|door|window)/.test(haystack)) {
    return 'Carpenter'
  }
  if (/(paint|wall|coating)/.test(haystack)) {
    return 'Painter'
  }
  if (/(driver|delivery|transport|pickup)/.test(haystack)) {
    return 'Driver'
  }
  return 'Other'
}

const serializeJob = (job) => ({
  id: job._id ? job._id.toString() : job.id,
  title: job.title,
  category: job.category,
  location: job.location,
  salary: job.salary,
  price: Number(job.price ?? job.salary ?? 0),
  budget: job.budget || job.salary || '',
  jobDate: job.jobDate || '',
  duration: job.duration || '',
  description: job.description,
  experienceRequired: job.experienceRequired || '',
  contactNumber: job.contactNumber || '',
  workType: job.workType || 'Full Time',
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
    if (!['employer', 'admin', 'super_admin'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Only employers and admins can publish jobs.' })
    }

    const isAdmin = ['admin', 'super_admin'].includes(req.user?.role)
    const coinSettings = await loadCoinSettings()
    const jobPostCoins = Number(coinSettings.usageRules?.jobPostCoins || 10)
    const freePostLimit = Number(coinSettings.freePostLimit || 3)

    if (!isAdmin) {
      const employer = await ensureUserWallet(req.user.id)
      if (!employer) return res.status(404).json({ message: 'User not found' })

      const freePostsUsed = Number(employer.freePostsUsed || 0)
      const coinBalance = Number(employer.coinBalance || 0)

      if (freePostsUsed >= freePostLimit && coinBalance < jobPostCoins) {
        return res.status(400).json({
          message: `Insufficient coins. You need ${jobPostCoins} coins to post a job. You have ${coinBalance} coins. Please buy more coins.`,
          code: 'INSUFFICIENT_COINS',
          coinBalance,
          required: jobPostCoins,
          freePostsUsed,
          freePostLimit,
        })
      }
    }

    const job = await Job.create({
      title: req.body.title?.trim(),
      category: inferCategoryFromRequest(req.body),
      location: req.body.location?.trim(),
      salary: req.body.salary?.trim(),
      price: parseMoneyValue(req.body.price ?? req.body.budget ?? req.body.salary ?? 0),
      budget: req.body.budget?.trim() || req.body.salary?.trim() || '',
      jobDate: req.body.jobDate?.trim() || '',
      duration: req.body.duration?.trim() || '',
      description: req.body.description?.trim(),
      experienceRequired: req.body.experienceRequired?.trim(),
      contactNumber: req.body.contactNumber?.trim(),
      workType: req.body.workType?.trim() || 'Full Time',
      postedBy: req.user?.id || req.body.postedBy || '',
      postedByRole: req.user?.role || req.body.postedByRole || 'employer',
      status: req.body.status || 'approved',
      goalTags: Array.isArray(req.body.goalTags) ? req.body.goalTags : [],
    })

    if (!isAdmin) {
      const employer = await User.findById(req.user.id)
      const freePostsUsed = Number(employer.freePostsUsed || 0)
      const coinBalance = Number(employer.coinBalance || 0)

      if (freePostsUsed < freePostLimit) {
        employer.freePostsUsed = freePostsUsed + 1
        await employer.save({ validateBeforeSave: false })

        await CoinTransaction.create({
          userId: employer._id,
          type: 'usage',
          amount: 0,
          balanceAfter: coinBalance,
          reason: `Free job post used (${freePostsUsed + 1}/${freePostLimit})`,
          referenceId: job._id,
          referenceType: 'Job',
          status: 'completed',
        })
      } else {
        const previousBalance = coinBalance
        const newBalance = previousBalance - jobPostCoins

        employer.coinBalance = newBalance
        employer.totalUsedCoins = Number(employer.totalUsedCoins || 0) + jobPostCoins
        await employer.save({ validateBeforeSave: false })

        await CoinTransaction.create({
          userId: employer._id,
          type: 'usage',
          amount: -jobPostCoins,
          balanceAfter: newBalance,
          reason: `Job post published: ${job.title}`,
          referenceId: job._id,
          referenceType: 'Job',
          status: 'completed',
        })
      }
    }

    const actorName = req.user?.name || req.body.postedByName || 'A member'
    const actorId = req.user?.id || req.body.postedBy || null

    await Promise.allSettled([
      notifyAdmins({
        type: 'job',
        title: 'New job posted',
        message: `${actorName} posted a new opportunity: ${job.title}.`,
        relatedId: job._id,
        fromUserId: actorId,
      }),
      actorId ? createNotification({
        userId: actorId,
        type: 'job',
        title: 'New job posted',
        message: `You posted a new opportunity: ${job.title}.`,
        relatedId: job._id,
        fromUserId: actorId,
      }) : null,
      recordUserActivity({
        userId: actorId,
        username: req.user?.email || req.body.postedByName || 'member',
        fullName: actorName,
        email: req.user?.email || '',
        role: req.user?.role || req.body.postedByRole || 'employer',
        action: 'job_created',
        entityType: 'job',
        entityId: job._id.toString(),
        entityTitle: job.title,
        details: 'Posted a new job',
      }),
    ])

    const updatedEmployer = !isAdmin ? await User.findById(req.user.id).lean() : null

    return res.status(201).json({
      job: serializeJob(job),
      coinInfo: updatedEmployer ? {
        coinBalance: Number(updatedEmployer.coinBalance || 0),
        freePostsUsed: Number(updatedEmployer.freePostsUsed || 0),
        freePostLimit,
      } : undefined,
    })
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

    const isOwner = existingJob.postedBy?.toString() === req.user?.id
    const isAdmin = ['admin', 'super_admin'].includes(req.user?.role)
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only edit your own posts.' })
    }

    const job = await Job.findByIdAndUpdate(req.params.id, {
      ...req.body,
      title: req.body.title?.trim(),
      category: inferCategoryFromRequest({ ...existingJob.toObject(), ...req.body }),
      location: req.body.location?.trim(),
      salary: req.body.salary?.trim(),
      price: parseMoneyValue(req.body.price ?? req.body.budget ?? req.body.salary ?? 0),
      budget: req.body.budget?.trim() || req.body.salary?.trim() || '',
      jobDate: req.body.jobDate?.trim() || '',
      duration: req.body.duration?.trim() || '',
      description: req.body.description?.trim(),
      experienceRequired: req.body.experienceRequired?.trim(),
      contactNumber: req.body.contactNumber?.trim(),
      workType: req.body.workType?.trim() || 'Full Time',
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

    const isOwner = existingJob.postedBy?.toString() === req.user?.id
    const isAdmin = ['admin', 'super_admin'].includes(req.user?.role)
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own posts.' })
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

    const applicant = await User.findById(req.user.id)
    const settings = await loadPlatformSettings()
    const hasActivePremium = !!applicant?.isPremium && (!applicant.premiumExpiryDate || new Date(applicant.premiumExpiryDate) > new Date())
    const applicationFee = hasActivePremium ? 0 : Number(settings.applicationFee ?? 20)

    if (!job.applicants.includes(req.user.id)) {
      job.applicants.push(req.user.id)
      await job.save()
    }

    const payment = await Payment.create({
      userId: req.user.id,
      workerId: req.user.id,
      amount: applicationFee,
      paymentType: 'application_fee',
      status: 'completed',
      transactionId: `application_${Date.now()}`,
    })

    const existingBooking = await Booking.findOne({ jobId: job._id.toString(), workerId: req.user.id, employerId: job.postedBy })
    if (!existingBooking) {
      await Booking.create({
        employerId: job.postedBy,
        workerId: req.user.id,
        userId: req.user.id,
        providerId: job.postedBy,
        jobId: job._id.toString(),
        serviceTitle: job.title,
        serviceProvider: job.category || 'General',
        amount: parseMoneyValue(job.price ?? job.salary ?? 0),
        price: parseMoneyValue(job.price ?? job.salary ?? 0),
        category: job.category || 'General',
        status: 'pending',
        paymentStatus: 'pending',
        contactName: req.user.name,
        contactEmail: req.user.email,
        contactPhone: req.user.phone || '',
        transactionId: `booking_${Date.now()}`,
      })
    }

    await Promise.allSettled([
      job.postedBy ? createNotification({
        userId: job.postedBy,
        type: 'application',
        title: 'New application',
        message: `A new application was submitted for ${job.title}.`,
        relatedId: job._id,
        fromUserId: req.user.id,
      }) : null,
      createNotification({
        userId: req.user.id,
        type: 'application',
        title: 'Application submitted',
        message: `You applied to ${job.title}.`,
        relatedId: job._id,
        fromUserId: job.postedBy,
      }),
      notifyAdmins({
        type: 'application',
        title: 'Job application',
        message: `${req.user.name || 'A member'} applied for ${job.title}.`,
        relatedId: job._id,
        fromUserId: req.user.id,
      }),
    ])

    emitPlatformEvent('application.created', {
      jobId: job._id.toString(),
      employerId: job.postedBy?.toString(),
      workerId: req.user.id,
      amount: payment.amount,
      paymentType: payment.paymentType,
      premiumWaived: hasActivePremium,
    })

    return res.status(201).json({
      application: { jobId: job._id.toString(), userId: req.user.id, status: 'pending' },
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
        status: payment.status,
        transactionId: payment.transactionId,
      },
    })
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

export const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 }).lean()
    return res.json({ jobs: jobs.map(serializeJob) })
  } catch (error) {
    console.error('jobs.getMyJobs failed', error)
    next(error)
  }
}

export default { listJobs, createJob, getJobById, updateJob, deleteJob, applyToJob, getApplications, getMyJobs }
