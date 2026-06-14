import Booking from '../models/Booking.js'
import Job from '../models/Job.js'
import Purchase from '../models/Purchase.js'
import Notification from '../models/Notification.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'

const buildUserBookingQuery = (userId) => ({
  $or: [{ employerId: userId }, { workerId: userId }, { userId }, { providerId: userId }],
})

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role || 'user'
    const [jobs, bookings, purchases, notifications, viewer, payments] = await Promise.all([
      Job.find({ postedBy: userId }).sort({ createdAt: -1 }).lean(),
      Booking.find(buildUserBookingQuery(userId)).sort({ createdAt: -1 }).lean(),
      Purchase.find({ userId }).sort({ createdAt: -1 }).lean(),
      Notification.find({ userId }).sort({ createdAt: -1 }).lean(),
      User.findById(userId).lean(),
      Payment.find({ $or: [{ workerId: userId }, { employerId: userId }] }).sort({ date: -1 }).lean(),
    ])

    const completedBookings = bookings.filter((booking) => booking.status === 'completed')
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending' || booking.status === 'accepted' || booking.status === 'waiting_for_verification')
    const activeJobs = jobs.filter((job) => job.status === 'approved').length
    const pendingJobs = jobs.filter((job) => job.status === 'pending').length
    const completedJobs = jobs.filter((job) => job.status === 'completed').length
    const spentAmount = completedBookings.reduce((sum, booking) => sum + Number(booking.amount || booking.price || 0), 0)
    const totalEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.amount || booking.price || 0), 0)

    const stats = {
      totalJobsApplied: 0,
      totalJobsPosted: jobs.length,
      totalBookings: bookings.length,
      totalReviews: 0,
      activeJobs,
      pendingJobs,
      completedJobs,
      pendingBookings: pendingBookings.length,
      confirmedBookings: bookings.filter((booking) => booking.status === 'accepted').length,
      completedBookings: completedBookings.length,
      cancelledBookings: bookings.filter((booking) => booking.status === 'cancelled' || booking.status === 'rejected').length,
      totalSpentAmount: spentAmount,
      totalEarnings,
      totalCompletedJobs: completedBookings.length,
      activeBookings: bookings.filter((booking) => booking.status === 'accepted' || booking.status === 'waiting_for_verification').length,
      platformEarnings: completedBookings.reduce((sum, booking) => sum + Number(booking.amount || booking.price || 0), 0),
      totalUsers: 0,
      totalWorkers: 0,
      totalEmployers: 0,
      totalRevenue: completedBookings.reduce((sum, booking) => sum + Number(booking.amount || booking.price || 0), 0),
      earnings: viewer?.earnings || 0,
      completedWorkerJobs: viewer?.completedJobs || 0,
    }

    if (role === 'worker') {
      stats.totalEarnings = Number(viewer?.earnings || 0)
      stats.totalCompletedJobs = Number(viewer?.completedJobs || 0)
      stats.pendingJobs = bookings.filter((booking) => booking.status === 'pending').length
      stats.activeJobs = bookings.filter((booking) => booking.status === 'accepted' || booking.status === 'waiting_for_verification').length
    }

    if (role === 'employer') {
      stats.totalJobsPosted = jobs.length
      stats.activeJobs = jobs.filter((job) => job.status === 'approved').length
      stats.completedJobs = completedBookings.length
      stats.totalSpentAmount = spentAmount
    }

    if (role === 'admin' || role === 'super_admin') {
      const [allUsers, allJobs, allBookings] = await Promise.all([
        User.find().lean(),
        Job.find().lean(),
        Booking.find().lean(),
      ])
      stats.totalUsers = allUsers.length
      stats.totalWorkers = allUsers.filter((user) => user.role === 'worker').length
      stats.totalEmployers = allUsers.filter((user) => user.role === 'employer').length
      stats.totalBookings = allBookings.length
      stats.totalRevenue = allBookings.filter((booking) => booking.status === 'completed').reduce((sum, booking) => sum + Number(booking.amount || booking.price || 0), 0)
      stats.platformEarnings = stats.totalRevenue
      stats.totalCompletedJobs = allBookings.filter((booking) => booking.status === 'completed').length
    }

    const earningsHistory = payments.slice(0, 6).map((payment) => ({
      id: payment._id?.toString?.() || payment.id,
      amount: Number(payment.amount || 0),
      status: payment.status || 'pending',
      date: payment.date || payment.createdAt,
      bookingId: payment.bookingId?.toString?.() || payment.bookingId,
    }))

    return res.json({ stats, recentJobs: jobs.slice(0, 5), recentBookings: bookings.slice(0, 5), recentPurchases: purchases.slice(0, 5), notifications, earningsHistory })
  } catch (error) {
    console.error('dashboard.getDashboardStats failed', error)
    next(error)
  }
}

export const getUserJobs = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.user.id
    const jobs = await Job.find({ postedBy: targetId }).sort({ createdAt: -1 }).lean()
    return res.json({ jobs })
  } catch (error) {
    console.error('dashboard.getUserJobs failed', error)
    next(error)
  }
}

export const getUserBookings = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.user.id
    const bookings = await Booking.find(buildUserBookingQuery(targetId)).sort({ createdAt: -1 }).lean()
    return res.json({ bookings })
  } catch (error) {
    console.error('dashboard.getUserBookings failed', error)
    next(error)
  }
}

export const getUserReviews = async (_req, res) => res.json({ reviews: [] })

export default { getDashboardStats, getUserJobs, getUserBookings, getUserReviews }
