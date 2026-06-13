import Booking from '../models/Booking.js'
import Job from '../models/Job.js'
import Purchase from '../models/Purchase.js'
import Notification from '../models/Notification.js'

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id
    const [jobs, bookings, purchases, notifications] = await Promise.all([
      Job.find({ postedBy: userId }).sort({ createdAt: -1 }).lean(),
      Booking.find({ userId }).sort({ createdAt: -1 }).lean(),
      Purchase.find({ userId }).sort({ createdAt: -1 }).lean(),
      Notification.find({ userId }).sort({ createdAt: -1 }).lean(),
    ])

    const stats = {
      totalJobsApplied: 0,
      totalJobsPosted: jobs.length,
      totalBookings: bookings.length,
      totalReviews: 0,
      activeJobs: jobs.filter((job) => job.status === 'approved').length,
      pendingJobs: jobs.filter((job) => job.status === 'pending').length,
      completedJobs: jobs.filter((job) => job.status === 'completed').length,
      pendingBookings: bookings.filter((booking) => booking.status === 'pending').length,
      confirmedBookings: bookings.filter((booking) => booking.status === 'confirmed').length,
      completedBookings: bookings.filter((booking) => booking.status === 'completed').length,
      cancelledBookings: bookings.filter((booking) => booking.status === 'cancelled').length,
    }

    return res.json({ stats, recentJobs: jobs.slice(0, 5), recentBookings: bookings.slice(0, 5), recentPurchases: purchases.slice(0, 5), notifications })
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
    const bookings = await Booking.find({ userId: targetId }).sort({ createdAt: -1 }).lean()
    return res.json({ bookings })
  } catch (error) {
    console.error('dashboard.getUserBookings failed', error)
    next(error)
  }
}

export const getUserReviews = async (_req, res) => res.json({ reviews: [] })

export default { getDashboardStats, getUserJobs, getUserBookings, getUserReviews }
