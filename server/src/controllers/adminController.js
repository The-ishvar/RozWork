import User from '../models/User.js'
import Job from '../models/Job.js'
import Booking from '../models/Booking.js'
import Purchase from '../models/Purchase.js'
import Notification from '../models/Notification.js'
import Service from '../models/Service.js'
import Transaction from '../models/Transaction.js'
import LoginHistory from '../models/LoginHistory.js'
import UserActivity from '../models/UserActivity.js'
import Payment from '../models/Payment.js'
import Setting from '../models/Setting.js'
import { getAuditLogs } from '../utils/audit.js'

const defaultPlatformSettings = {
  siteName: 'RozWork',
  maintenanceMode: false,
  platformCommission: 5,
  premiumPrice: 99,
  applicationFee: 20,
}

const loadPlatformSettings = async () => {
  const settings = await Setting.find({}).lean()
  return { ...defaultPlatformSettings, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) }
}

const serializeJobForAdmin = (job) => ({
  id: job._id ? job._id.toString() : job.id,
  title: job.title,
  category: job.category,
  location: job.location,
  salary: job.salary,
  price: Number(job.price ?? job.salary ?? 0),
  budget: job.budget || job.salary || '',
  description: job.description,
  status: job.status,
  postedBy: job.postedBy ? job.postedBy.toString() : '',
  postedByRole: job.postedByRole || 'employer',
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
})

const serializeUser = (user) => ({
  id: user._id ? user._id.toString() : user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  username: user.username || '',
  isVerified: user.isVerified !== false,
  isSuspended: !!user.isSuspended,
  isBanned: !!user.isBanned,
  lastActiveAt: user.lastActiveAt,
  createdAt: user.createdAt,
})

export const getUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean()
    return res.json({ users: users.map(serializeUser) })
  } catch (error) {
    console.error('admin.getUsers failed', error)
    next(error)
  }
}

export const getLoginHistory = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().toLowerCase()
    const role = String(req.query.role || '').trim()
    const date = String(req.query.date || '').trim()

    const logins = await LoginHistory.find().sort({ loginAt: -1 }).lean()
    const filtered = logins.filter((entry) => {
      const haystack = [entry.fullName, entry.email, entry.username, entry.role].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesRole = !role || entry.role === role
      const matchesDate = !date || entry.loginAt?.toISOString().slice(0, 10) === date
      return matchesQuery && matchesRole && matchesDate
    })

    return res.json({ logins: filtered.map((entry) => ({
      id: entry._id.toString(),
      userId: entry.userId?.toString(),
      username: entry.username,
      fullName: entry.fullName,
      email: entry.email,
      role: entry.role,
      loginAt: entry.loginAt,
      lastActiveAt: entry.lastActiveAt,
      ipAddress: entry.ipAddress,
      deviceInfo: entry.deviceInfo,
    })) })
  } catch (error) {
    console.error('admin.getLoginHistory failed', error)
    next(error)
  }
}

export const getUserActivities = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().toLowerCase()
    const role = String(req.query.role || '').trim()
    const date = String(req.query.date || '').trim()

    const activities = await UserActivity.find().sort({ createdAt: -1 }).lean()
    const filtered = activities.filter((entry) => {
      const haystack = [entry.fullName, entry.email, entry.username, entry.action, entry.entityTitle, entry.details].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesRole = !role || entry.role === role
      const matchesDate = !date || entry.createdAt?.toISOString().slice(0, 10) === date
      return matchesQuery && matchesRole && matchesDate
    })

    return res.json({ activities: filtered.map((entry) => ({
      id: entry._id.toString(),
      userId: entry.userId?.toString(),
      username: entry.username,
      fullName: entry.fullName,
      email: entry.email,
      role: entry.role,
      action: entry.action,
      entityType: entry.entityType,
      entityTitle: entry.entityTitle,
      details: entry.details,
      createdAt: entry.createdAt,
    })) })
  } catch (error) {
    console.error('admin.getUserActivities failed', error)
    next(error)
  }
}

export const getStats = async (_req, res, next) => {
  try {
    const [users, jobs, bookings, purchases, notifications, transactions, payments] = await Promise.all([
      User.find().lean(),
      Job.find().lean(),
      Booking.find().lean(),
      Purchase.find().lean(),
      Notification.find().lean(),
      Transaction.find().lean(),
      Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).lean(),
    ])

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const todayRevenue = payments.filter((payment) => payment.createdAt && new Date(payment.createdAt).toDateString() === new Date().toDateString()).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const monthlyRevenue = payments.filter((payment) => payment.createdAt && new Date(payment.createdAt).getMonth() === new Date().getMonth() && new Date(payment.createdAt).getFullYear() === new Date().getFullYear()).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const applicationFeeRevenue = payments.filter((payment) => payment.paymentType === 'application_fee').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const bookingFeeRevenue = payments.filter((payment) => payment.paymentType === 'booking_fee').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const premiumRevenue = payments.filter((payment) => payment.paymentType === 'premium_membership').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    const stats = {
      totalUsers: users.length,
      totalWorkers: users.filter((user) => user.role === 'worker').length,
      totalEmployers: users.filter((user) => user.role === 'employer').length,
      totalBookings: bookings.length,
      totalJobs: jobs.length,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      applicationFeeRevenue,
      bookingFeeRevenue,
      premiumRevenue,
      totalNotifications: notifications.length,
      activeUsers: users.filter((user) => !user.isSuspended && !user.isBanned).length,
      pendingJobs: jobs.filter((job) => job.status === 'pending').length,
      completedBookings: bookings.filter((booking) => booking.status === 'completed').length,
      totalTransactions: transactions.length,
      premiumUsers: users.filter((user) => user.isPremium).length,
    }

    return res.json({ stats })
  } catch (error) {
    console.error('admin.getStats failed', error)
    next(error)
  }
}

export const getOverview = async (_req, res, next) => {
  try {
    const [users, jobs, bookings, purchases, notifications, payments] = await Promise.all([
      User.find().lean(),
      Job.find().sort({ createdAt: -1 }).lean(),
      Booking.find().sort({ createdAt: -1 }).lean(),
      Purchase.find().sort({ createdAt: -1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).lean(),
      Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).lean(),
    ])

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const applicationFeeRevenue = payments.filter((payment) => payment.paymentType === 'application_fee').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const bookingFeeRevenue = payments.filter((payment) => payment.paymentType === 'booking_fee').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const premiumRevenue = payments.filter((payment) => payment.paymentType === 'premium_membership').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const revenueByMonth = Array.from({ length: 6 }, (_, index) => {
      const month = new Date()
      month.setMonth(month.getMonth() - index)
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      const value = payments.filter((payment) => payment.createdAt && `${new Date(payment.createdAt).getFullYear()}-${String(new Date(payment.createdAt).getMonth() + 1).padStart(2, '0')}` === key).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      return { label: month.toLocaleString('default', { month: 'short' }), value }
    }).reverse()
    const topEarningWorkers = users.filter((user) => user.role === 'worker').sort((left, right) => Number(right.earnings || 0) - Number(left.earnings || 0)).slice(0, 5).map((user) => ({ name: user.name, earnings: Number(user.earnings || 0), category: user.profession || 'Worker' }))

    const stats = {
      totalUsers: users.length,
      totalWorkers: users.filter((user) => user.role === 'worker').length,
      totalEmployers: users.filter((user) => user.role === 'employer').length,
      totalBookings: bookings.length,
      totalJobs: jobs.length,
      totalRevenue,
      totalNotifications: notifications.length,
      applicationFeeRevenue,
      bookingFeeRevenue,
      premiumRevenue,
      premiumUsers: users.filter((user) => user.isPremium).length,
    }

    return res.json({
      stats,
      users: users.map(serializeUser),
      jobs,
      notifications,
      activities: notifications.slice(0, 6).map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
      })),
      pendingContent: jobs.filter((job) => job.status === 'pending').slice(0, 6),
      recentPurchases: purchases.slice(0, 6),
      auditLogs: getAuditLogs().slice(0, 10),
      revenueAnalytics: {
        totalRevenue,
        applicationFeeRevenue,
        bookingFeeRevenue,
        premiumRevenue,
        revenueByMonth,
        topEarningWorkers,
      },
    })
  } catch (error) {
    console.error('admin.getOverview failed', error)
    next(error)
  }
}

export const updateUserStatus = async (req, res, next) => {
  try {
    const { status, role, ...profileUpdates } = req.body
    const updates = { ...profileUpdates }

    if (status === 'suspend') updates.isSuspended = true
    if (status === 'ban') updates.isBanned = true
    if (status === 'verify') updates.isVerified = true
    if (status === 'active') {
      updates.isSuspended = false
      updates.isBanned = false
      updates.isVerified = true
    }
    if (role) updates.role = role

    const user = await User.findByIdAndUpdate(req.params.userId, updates, { new: true, runValidators: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    await Notification.create({
      userId: user._id,
      type: 'account_update',
      title: 'Account updated',
      message: `Your account status was updated to ${status || 'reviewed'}.`,
    })
    return res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('admin.updateUserStatus failed', error)
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId)
    if (!deleted) return res.status(404).json({ message: 'User not found' })
    return res.json({ success: true })
  } catch (error) {
    console.error('admin.deleteUser failed', error)
    next(error)
  }
}

export const updateJob = async (req, res, next) => {
  try {
    const { status, ...updates } = req.body
    const payload = { ...updates }
    if (status) payload.status = status

    const job = await Job.findByIdAndUpdate(req.params.jobId, payload, { new: true, runValidators: true })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    return res.json({ job: serializeJobForAdmin(job) })
  } catch (error) {
    console.error('admin.updateJob failed', error)
    next(error)
  }
}

export const updateJobStatus = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.jobId, { status: req.body.status }, { new: true, runValidators: true })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    return res.json({ job: serializeJobForAdmin(job) })
  } catch (error) {
    console.error('admin.updateJobStatus failed', error)
    next(error)
  }
}

export const deleteJob = async (req, res, next) => {
  try {
    const deleted = await Job.findByIdAndDelete(req.params.jobId)
    if (!deleted) return res.status(404).json({ message: 'Job not found' })
    return res.json({ success: true })
  } catch (error) {
    console.error('admin.deleteJob failed', error)
    next(error)
  }
}

export const getContent = async (_req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean()
    return res.json({ posts: services })
  } catch (error) {
    console.error('admin.getContent failed', error)
    next(error)
  }
}

export const createContent = async (req, res, next) => {
  try {
    const post = await Service.create({
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category || 'General',
      price: Number(req.body.price || 0),
      providerId: req.user?.id,
      providerName: req.user?.name || 'Admin',
      location: req.body.location || '',
      status: req.body.status || 'active',
      tags: req.body.tags || [],
    })
    return res.status(201).json({ post })
  } catch (error) {
    console.error('admin.createContent failed', error)
    next(error)
  }
}

export const updateContent = async (req, res, next) => {
  try {
    const post = await Service.findByIdAndUpdate(req.params.contentId, req.body, { new: true, runValidators: true })
    if (!post) return res.status(404).json({ message: 'Content not found' })
    return res.json({ post })
  } catch (error) {
    console.error('admin.updateContent failed', error)
    next(error)
  }
}

export const deleteContent = async (req, res, next) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.contentId)
    if (!deleted) return res.status(404).json({ message: 'Content not found' })
    return res.json({ success: true })
  } catch (error) {
    console.error('admin.deleteContent failed', error)
    next(error)
  }
}

export const getSettings = async (_req, res, next) => {
  try {
    const settings = await loadPlatformSettings()
    return res.json({ settings })
  } catch (error) {
    console.error('admin.getSettings failed', error)
    next(error)
  }
}

export const updateSettings = async (req, res, next) => {
  try {
    const updates = { ...req.body }
    const entries = Object.entries(updates)
    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    }
    const settings = await loadPlatformSettings()
    return res.json({ settings })
  } catch (error) {
    console.error('admin.updateSettings failed', error)
    next(error)
  }
}

export const getNotifications = async (_req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).lean()
    return res.json({ notifications })
  } catch (error) {
    console.error('admin.getNotifications failed', error)
    next(error)
  }
}

export const getAuditHistory = async (_req, res) => res.json({ logs: getAuditLogs() })

export const getBookingTracking = async (_req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean()
    const extended = await Promise.all(bookings.map(async (booking) => {
      const [employer, worker] = await Promise.all([
        User.findById(booking.employerId || booking.userId).lean(),
        User.findById(booking.workerId || booking.providerId).lean(),
      ])

      return {
        id: booking._id.toString(),
        employerName: employer?.name || 'Unknown',
        workerName: worker?.name || 'Unknown',
        bookingDate: booking.createdAt,
        amount: booking.amount || booking.price || 0,
        status: booking.status,
        verificationStatus: booking.verificationStatus || 'pending',
        paymentStatus: booking.paymentStatus || 'pending',
        completedAt: booking.completedAt || null,
        category: booking.category || 'General',
      }
    }))

    return res.json({ bookings: extended })
  } catch (error) {
    console.error('admin.getBookingTracking failed', error)
    next(error)
  }
}

export const submitModerationAction = async (req, res, next) => {
  try {
    const { action, type, id } = req.body
    if (type === 'job' && id) {
      const job = await Job.findByIdAndUpdate(id, { status: action === 'approve' ? 'approved' : 'rejected' }, { new: true })
      return res.json({ job })
    }

    if (type === 'user' && id) {
      const user = await User.findByIdAndUpdate(id, { isVerified: action === 'approve' }, { new: true })
      return res.json({ user: serializeUser(user) })
    }

    return res.status(400).json({ message: 'Unsupported moderation action' })
  } catch (error) {
    console.error('admin.submitModerationAction failed', error)
    next(error)
  }
}

export const bulkAction = async (req, res, next) => {
  try {
    const { action, type } = req.body
    if (type === 'jobs') {
      await Job.updateMany({}, { status: action === 'approve' ? 'approved' : 'rejected' })
      return res.json({ success: true })
    }
    if (type === 'users') {
      await User.updateMany({}, { isVerified: action === 'approve' })
      return res.json({ success: true })
    }
    return res.status(400).json({ message: 'Unsupported bulk action' })
  } catch (error) {
    console.error('admin.bulkAction failed', error)
    next(error)
  }
}

export default {
  getUsers,
  getStats,
  getOverview,
  updateUserStatus,
  deleteUser,
  updateJob,
  updateJobStatus,
  deleteJob,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getSettings,
  updateSettings,
  getNotifications,
  getAuditHistory,
  getBookingTracking,
  submitModerationAction,
  bulkAction,
}
