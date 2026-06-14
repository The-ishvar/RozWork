import User from '../models/User.js'
import Job from '../models/Job.js'
import Booking from '../models/Booking.js'
import Purchase from '../models/Purchase.js'
import Notification from '../models/Notification.js'
import Service from '../models/Service.js'
import Transaction from '../models/Transaction.js'
import { getAuditLogs } from '../utils/audit.js'

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

export const getStats = async (_req, res, next) => {
  try {
    const [users, jobs, bookings, purchases, notifications, transactions] = await Promise.all([
      User.find().lean(),
      Job.find().lean(),
      Booking.find().lean(),
      Purchase.find().lean(),
      Notification.find().lean(),
      Transaction.find().lean(),
    ])

    const totalRevenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0)
    const stats = {
      totalUsers: users.length,
      totalWorkers: users.filter((user) => user.role === 'worker').length,
      totalEmployers: users.filter((user) => user.role === 'employer').length,
      totalBookings: bookings.length,
      totalJobs: jobs.length,
      totalRevenue,
      totalNotifications: notifications.length,
      activeUsers: users.filter((user) => !user.isSuspended && !user.isBanned).length,
      pendingJobs: jobs.filter((job) => job.status === 'pending').length,
      completedBookings: bookings.filter((booking) => booking.status === 'completed').length,
      totalTransactions: transactions.length,
    }

    return res.json({ stats })
  } catch (error) {
    console.error('admin.getStats failed', error)
    next(error)
  }
}

export const getOverview = async (_req, res, next) => {
  try {
    const [users, jobs, bookings, purchases, notifications] = await Promise.all([
      User.find().lean(),
      Job.find().sort({ createdAt: -1 }).lean(),
      Booking.find().sort({ createdAt: -1 }).lean(),
      Purchase.find().sort({ createdAt: -1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).lean(),
    ])

    const stats = {
      totalUsers: users.length,
      totalWorkers: users.filter((user) => user.role === 'worker').length,
      totalEmployers: users.filter((user) => user.role === 'employer').length,
      totalBookings: bookings.length,
      totalJobs: jobs.length,
      totalRevenue: purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0),
      totalNotifications: notifications.length,
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

export const updateJobStatus = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.jobId, { status: req.body.status }, { new: true, runValidators: true })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    return res.json({ job })
  } catch (error) {
    console.error('admin.updateJobStatus failed', error)
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

export const getSettings = async (_req, res) => res.json({ settings: { siteName: 'RozWork', maintenanceMode: false } })

export const updateSettings = async (req, res) => res.json({ settings: req.body })

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
  updateJobStatus,
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
