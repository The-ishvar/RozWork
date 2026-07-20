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
import { createNotification, notifyAdmins } from '../utils/notify.js'

const defaultPlatformSettings = {
  siteName: 'RozWork',
  maintenanceMode: false,
  employerCommission: 10,
  workerCommission: 2,
  premiumPrice: 99,
  applicationFee: 20,
  razorpayEnabled: true,
  upiEnabled: true,
  phonepeEnabled: true,
  gpayEnabled: true,
  paytmEnabled: true,
  razorpayKeyId: '',
  razorpayKeySecret: '',
  minBookingAmount: 100,
  maxBookingAmount: 1000000,
  autoCancelDays: 7,
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
  earnings: user.earnings || 0,
  totalSpent: user.totalSpent || 0,
  walletBalance: user.walletBalance || 0,
  totalCommissionPaid: user.totalCommissionPaid || 0,
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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const todayPayments = payments.filter((p) => p.createdAt && new Date(p.createdAt) >= todayStart)
    const todayRevenue = todayPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const monthlyPayments = payments.filter((p) => {
      const d = new Date(p.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const applicationFeeRevenue = payments.filter((p) => p.paymentType === 'application_fee').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const bookingFeeRevenue = payments.filter((p) => p.paymentType === 'booking_fee').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const premiumRevenue = payments.filter((p) => p.paymentType === 'premium_membership').reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const employerCommissionTotal = payments.reduce((sum, p) => sum + Number(p.employerCommission || 0), 0)
    const workerCommissionTotal = payments.reduce((sum, p) => sum + Number(p.workerCommission || 0), 0)

    const todayBookings = bookings.filter((b) => b.createdAt && new Date(b.createdAt) >= todayStart)

    const stats = {
      totalUsers: users.length,
      totalWorkers: users.filter((u) => u.role === 'worker').length,
      totalEmployers: users.filter((u) => u.role === 'employer').length,
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      pendingBookings: bookings.filter((b) => b.status === 'pending').length,
      completedBookings: bookings.filter((b) => b.status === 'completed').length,
      cancelledBookings: bookings.filter((b) => b.status === 'cancelled').length,
      totalJobs: jobs.length,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      employerCommission: employerCommissionTotal,
      workerCommission: workerCommissionTotal,
      totalCommission: employerCommissionTotal + workerCommissionTotal,
      applicationFeeRevenue,
      bookingFeeRevenue,
      premiumRevenue,
      totalNotifications: notifications.length,
      activeUsers: users.filter((u) => !u.isSuspended && !u.isBanned).length,
      pendingJobs: jobs.filter((j) => j.status === 'pending').length,
      totalTransactions: transactions.length,
      paymentSuccess: payments.filter((p) => p.status === 'completed').length,
      paymentFailed: payments.filter((p) => p.status === 'failed').length,
      refunds: payments.filter((p) => p.status === 'refunded').length,
      premiumUsers: users.filter((u) => u.isPremium).length,
      topWorkers: users.filter((u) => u.role === 'worker').sort((a, b) => Number(b.earnings || 0) - Number(a.earnings || 0)).slice(0, 5).map((u) => ({ name: u.name, earnings: Number(u.earnings || 0), id: u._id.toString() })),
      topEmployers: users.filter((u) => u.role === 'employer').sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0)).slice(0, 5).map((u) => ({ name: u.name, totalSpent: Number(u.totalSpent || 0), id: u._id.toString() })),
      latestBookings: bookings.slice(0, 10).map((b) => ({ id: b._id.toString(), serviceTitle: b.serviceTitle, amount: b.amount, status: b.status, createdAt: b.createdAt })),
      latestPayments: payments.slice(0, 10).map((p) => ({ id: p._id.toString(), amount: p.amount, paymentType: p.paymentType, status: p.status, createdAt: p.createdAt })),
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
    const employerCommissionTotal = payments.reduce((sum, p) => sum + Number(p.employerCommission || 0), 0)
    const workerCommissionTotal = payments.reduce((sum, p) => sum + Number(p.workerCommission || 0), 0)
    const applicationFeeRevenue = payments.filter((p) => p.paymentType === 'application_fee').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const bookingFeeRevenue = payments.filter((p) => p.paymentType === 'booking_fee').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const premiumRevenue = payments.filter((p) => p.paymentType === 'premium_membership').reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const revenueByMonth = Array.from({ length: 6 }, (_, index) => {
      const month = new Date()
      month.setMonth(month.getMonth() - index)
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      const value = payments.filter((p) => p.createdAt && `${new Date(p.createdAt).getFullYear()}-${String(new Date(p.createdAt).getMonth() + 1).padStart(2, '0')}` === key).reduce((sum, p) => sum + Number(p.amount || 0), 0)
      return { label: month.toLocaleString('default', { month: 'short' }), value }
    }).reverse()

    const topEarningWorkers = users.filter((u) => u.role === 'worker').sort((a, b) => Number(b.earnings || 0) - Number(a.earnings || 0)).slice(0, 5).map((u) => ({ name: u.name, earnings: Number(u.earnings || 0), category: u.profession || 'Worker' }))

    const stats = {
      totalUsers: users.length,
      totalWorkers: users.filter((u) => u.role === 'worker').length,
      totalEmployers: users.filter((u) => u.role === 'employer').length,
      totalBookings: bookings.length,
      totalJobs: jobs.length,
      totalRevenue,
      totalNotifications: notifications.length,
      applicationFeeRevenue,
      bookingFeeRevenue,
      premiumRevenue,
      premiumUsers: users.filter((u) => u.isPremium).length,
      employerCommission: employerCommissionTotal,
      workerCommission: workerCommissionTotal,
      totalCommission: employerCommissionTotal + workerCommissionTotal,
    }

    return res.json({
      stats,
      users: users.map(serializeUser),
      jobs,
      notifications,
      activities: notifications.slice(0, 6).map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
      })),
      pendingContent: jobs.filter((j) => j.status === 'pending').slice(0, 6),
      recentPurchases: purchases.slice(0, 6),
      auditLogs: getAuditLogs().slice(0, 10),
      revenueAnalytics: {
        totalRevenue,
        applicationFeeRevenue,
        bookingFeeRevenue,
        premiumRevenue,
        employerCommission: employerCommissionTotal,
        workerCommission: workerCommissionTotal,
        totalCommission: employerCommissionTotal + workerCommissionTotal,
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

export const getBookingTracking = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50, search = '' } = req.query
    const query = {}
    if (status) query.status = status

    const total = await Booking.countDocuments(query)
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean()

    const extended = await Promise.all(bookings.map(async (booking) => {
      const [employer, worker] = await Promise.all([
        User.findById(booking.employerId || booking.userId).lean(),
        User.findById(booking.workerId || booking.providerId).lean(),
      ])
      return {
        id: booking._id.toString(),
        employerName: employer?.name || 'Unknown',
        employerId: employer?._id?.toString() || '',
        workerName: worker?.name || 'Unknown',
        workerId: worker?._id?.toString() || '',
        serviceTitle: booking.serviceTitle || '',
        category: booking.category || 'General',
        amount: booking.amount || booking.price || 0,
        employerPays: booking.employerPays || 0,
        workerReceives: booking.workerReceives || 0,
        totalPlatformCommission: booking.totalPlatformCommission || 0,
        employerCommissionAmount: booking.employerCommissionAmount || 0,
        workerCommissionAmount: booking.workerCommissionAmount || 0,
        status: booking.status,
        paymentStatus: booking.paymentStatus || 'pending',
        paymentMethod: booking.paymentMethod || '',
        verificationStatus: booking.verificationStatus || 'pending',
        refundStatus: booking.refundStatus || 'none',
        refundAmount: booking.refundAmount || 0,
        completedAt: booking.completedAt || null,
        createdAt: booking.createdAt,
        address: booking.address || '',
        village: booking.village || '',
        bookingDate: booking.bookingDate || '',
        bookingTime: booking.bookingTime || '',
      }
    }))

    let filtered = extended
    if (search) {
      const q = search.toLowerCase()
      filtered = extended.filter((b) =>
        b.employerName.toLowerCase().includes(q) ||
        b.workerName.toLowerCase().includes(q) ||
        b.serviceTitle.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      )
    }

    return res.json({
      bookings: filtered,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    console.error('admin.getBookingTracking failed', error)
    next(error)
  }
}

export const getAllPayments = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query
    const query = {}
    if (status) query.status = status
    if (type) query.paymentType = type

    const total = await Payment.countDocuments(query)
    const payments = await Payment.find(query).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean()

    const extended = await Promise.all(payments.map(async (payment) => {
      const [employer, worker] = await Promise.all([
        payment.employerId ? User.findById(payment.employerId).lean() : null,
        payment.workerId ? User.findById(payment.workerId).lean() : null,
      ])
      return {
        id: payment._id.toString(),
        employerName: employer?.name || 'Unknown',
        workerName: worker?.name || 'Unknown',
        amount: payment.amount || 0,
        totalAmount: payment.totalAmount || 0,
        commissionAmount: payment.commissionAmount || 0,
        employerCommission: payment.employerCommission || 0,
        workerCommission: payment.workerCommission || 0,
        workerAmount: payment.workerAmount || 0,
        paymentType: payment.paymentType || 'other',
        paymentMethod: payment.paymentMethod || '',
        status: payment.status || 'completed',
        transactionId: payment.transactionId || '',
        refundStatus: payment.refundStatus || 'none',
        refundAmount: payment.refundAmount || 0,
        createdAt: payment.createdAt,
        date: payment.date || payment.createdAt,
      }
    }))

    return res.json({
      payments: extended,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    console.error('admin.getAllPayments failed', error)
    next(error)
  }
}

export const approveRefund = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const { action } = req.body

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.refundStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending refund for this booking.' })
    }

    booking.refundStatus = action === 'approve' ? 'approved' : 'rejected'
    if (action === 'approve') {
      booking.paymentStatus = 'refunded'
      await booking.save()

      const employer = await User.findById(booking.employerId || booking.userId)
      if (employer) {
        employer.totalSpent = Math.max(0, Number(employer.totalSpent || 0) - Number(booking.refundAmount || 0))
        await employer.save()
      }

      await Payment.create({
        userId: booking.employerId || booking.userId,
        workerId: booking.workerId,
        employerId: booking.employerId || booking.userId,
        bookingId: booking._id,
        amount: booking.refundAmount || 0,
        paymentType: 'refund',
        status: 'completed',
        refundStatus: 'completed',
        refundAmount: booking.refundAmount || 0,
        refundDate: new Date(),
        transactionId: `refund_${Date.now()}`,
      })

      await Transaction.create({
        userId: booking.employerId || booking.userId,
        type: 'refund',
        amount: booking.refundAmount || 0,
        currency: 'INR',
        status: 'completed',
        bookingId: booking._id,
        description: `Refund for ${booking.serviceTitle}`,
      })
    } else {
      booking.refundStatus = 'rejected'
      await booking.save()
    }

    await createNotification({
      userId: booking.employerId || booking.userId,
      type: 'refund_' + (action === 'approve' ? 'approved' : 'rejected'),
      title: action === 'approve' ? 'Refund Approved' : 'Refund Rejected',
      message: action === 'approve'
        ? `Your refund of ₹${booking.refundAmount} for ${booking.serviceTitle} has been approved and processed.`
        : `Your refund request for ${booking.serviceTitle} has been rejected.`,
      relatedId: booking._id,
    })

    return res.json({ message: `Refund ${action === 'approve' ? 'approved' : 'rejected'} successfully`, booking: { id: booking._id.toString(), refundStatus: booking.refundStatus } })
  } catch (error) {
    console.error('admin.approveRefund failed', error)
    next(error)
  }
}

export const exportData = async (req, res, next) => {
  try {
    const { type } = req.params
    const { format = 'csv' } = req.query

    let data = []
    let headers = []

    if (type === 'bookings') {
      const bookings = await Booking.find().sort({ createdAt: -1 }).lean()
      headers = ['ID', 'Service', 'Amount', 'Employer Pays', 'Worker Receives', 'Commission', 'Status', 'Payment Status', 'Created']
      data = bookings.map((b) => [b._id.toString(), b.serviceTitle, b.amount, b.employerPays || 0, b.workerReceives || 0, b.totalPlatformCommission || 0, b.status, b.paymentStatus, new Date(b.createdAt).toISOString()])
    } else if (type === 'payments') {
      const payments = await Payment.find().sort({ createdAt: -1 }).lean()
      headers = ['ID', 'Amount', 'Type', 'Method', 'Status', 'Commission', 'Worker Amount', 'Created']
      data = payments.map((p) => [p._id.toString(), p.amount, p.paymentType, p.paymentMethod || '', p.status, p.commissionAmount || 0, p.workerAmount || 0, new Date(p.createdAt).toISOString()])
    } else if (type === 'transactions') {
      const transactions = await Transaction.find().sort({ createdAt: -1 }).lean()
      headers = ['ID', 'Type', 'Amount', 'Status', 'Description', 'Created']
      data = transactions.map((t) => [t._id.toString(), t.type, t.amount, t.status, t.description || '', new Date(t.createdAt).toISOString()])
    } else if (type === 'users') {
      const users = await User.find().sort({ createdAt: -1 }).lean()
      headers = ['ID', 'Name', 'Email', 'Role', 'Earnings', 'Spent', 'Commission Paid', 'Created']
      data = users.map((u) => [u._id.toString(), u.name, u.email, u.role, u.earnings || 0, u.totalSpent || 0, u.totalCommissionPaid || 0, new Date(u.createdAt).toISOString()])
    } else {
      return res.status(400).json({ message: 'Invalid export type. Use: bookings, payments, transactions, users' })
    }

    if (format === 'csv') {
      const csv = [headers.join(','), ...data.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=rozwork-${type}.csv`)
      return res.send(csv)
    }

    return res.json({ type, headers, data, total: data.length })
  } catch (error) {
    console.error('admin.exportData failed', error)
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
  getAllPayments,
  approveRefund,
  exportData,
  submitModerationAction,
  bulkAction,
}
