import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getDashboardStats, getUserJobs, getUserBookings, getUserReviews } from '../controllers/dashboardController.js'

const router = express.Router()

router.get('/stats', authenticate, getDashboardStats)
router.get('/jobs/user/:id', authenticate, getUserJobs)
router.get('/bookings/user/:id', authenticate, getUserBookings)
router.get('/reviews/user/:id', authenticate, getUserReviews)

export default router
