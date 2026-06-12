const dataService = require('../services/dataService')

const normalizeDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const makeSeries = (items, keyName, days) => {
  const now = new Date()
  const buckets = []
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - index)
    const iso = date.toISOString().slice(0, 10)
    buckets.push({ date: iso, [keyName]: 0 })
  }

  items.forEach((item) => {
    const iso = normalizeDate(item.createdAt || item.created_on || item.date || item.joinDate)
    if (!iso) return
    const match = buckets.find((entry) => entry.date === iso)
    if (match) {
      match[keyName] += 1
    }
  })

  return buckets
}

const getDashboardStats = async (req, res) => {
  const userId = req.user?.id
  const [jobs, applications, purchases, reviews, allJobs] = await Promise.all([
    dataService.getJobs(),
    dataService.getApplicationsForUser(userId),
    dataService.getPurchasesForUser(userId),
    dataService.getReviews(),
    dataService.getJobs(),
  ])

  const myJobs = allJobs.filter((job) => String(job.postedBy) === String(userId))
  const myReviews = reviews.filter((review) => String(review.userId) === String(userId) || String(review.targetId) === String(userId))
  const bookings = purchases || []

  const stats = {
    totalJobsApplied: applications.length,
    totalJobsPosted: myJobs.length,
    totalBookings: bookings.length,
    totalReviews: myReviews.length,
    activeJobs: myJobs.filter((job) => job.status === 'approved').length,
    pendingJobs: myJobs.filter((job) => job.status === 'pending').length,
    completedJobs: myJobs.filter((job) => job.status === 'completed').length,
    expiredJobs: myJobs.filter((job) => job.status === 'expired').length,
    pendingBookings: bookings.filter((booking) => String(booking.status || 'confirmed').toLowerCase() === 'pending').length,
    confirmedBookings: bookings.filter((booking) => String(booking.status || 'confirmed').toLowerCase() === 'confirmed').length,
    completedBookings: bookings.filter((booking) => String(booking.status || 'confirmed').toLowerCase() === 'completed').length,
    cancelledBookings: bookings.filter((booking) => String(booking.status || 'confirmed').toLowerCase() === 'cancelled').length,
  }

  const recentJobs = myJobs.slice().sort((left, right) => new Date(right.createdAt || right.postedAt || 0) - new Date(left.createdAt || left.postedAt || 0)).slice(0, 5)
  const recentApplications = applications.slice().sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).slice(0, 5)
  const recentBookings = bookings.slice().sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).slice(0, 5)
  const recentReviews = myReviews.slice().sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)).slice(0, 5)

  const timeline = [...recentJobs.map((job) => ({ type: 'job', title: job.title || 'Job posted', createdAt: job.createdAt || new Date().toISOString() })), ...recentApplications.map((application) => ({ type: 'application', title: application.note || 'Application submitted', createdAt: application.createdAt || new Date().toISOString() })), ...recentBookings.map((booking) => ({ type: 'booking', title: booking.service || booking.workerName || 'Booking confirmed', createdAt: booking.createdAt || new Date().toISOString() })), ...recentReviews.map((review) => ({ type: 'review', title: review.comment || 'Review shared', createdAt: review.createdAt || new Date().toISOString() }))]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 10)

  return res.json({ stats, recentJobs, recentApplications, recentBookings, recentReviews, timeline })
}

const getUserJobs = async (req, res) => {
  const { id } = req.params
  const jobs = await dataService.getJobs()
  const userJobs = jobs.filter((job) => String(job.postedBy) === String(id))
  return res.json({ jobs: userJobs })
}

const getUserBookings = async (req, res) => {
  const { id } = req.params
  const purchases = await dataService.getAllPurchases()
  const bookings = purchases.filter((purchase) => String(purchase.userId) === String(id))
  return res.json({ bookings })
}

const getUserReviews = async (req, res) => {
  const { id } = req.params
  const reviews = await dataService.getReviews()
  const userReviews = reviews.filter((review) => String(review.userId) === String(id) || String(review.targetId) === String(id))
  return res.json({ reviews: userReviews })
}

module.exports = { getDashboardStats, getUserJobs, getUserBookings, getUserReviews }
