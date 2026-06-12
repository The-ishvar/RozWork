const express = require('express')
const { authenticate } = require('../middleware/auth')
const { getDashboardStats, getUserJobs, getUserBookings, getUserReviews } = require('../controllers/dashboardController')

const router = express.Router()

router.get('/stats', authenticate, getDashboardStats)
router.get('/jobs/user/:id', authenticate, getUserJobs)
router.get('/bookings/user/:id', authenticate, getUserBookings)
router.get('/reviews/user/:id', authenticate, getUserReviews)

module.exports = router
