import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { createBooking, listBookings } from '../controllers/bookingController.js'

const router = express.Router()

router.get('/', authenticate, listBookings)
router.post('/', authenticate, createBooking)

export default router
