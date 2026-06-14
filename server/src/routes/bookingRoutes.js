import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { acceptBooking, completeBooking, createBooking, listBookings, rejectBooking, rejectVerification, verifyBooking } from '../controllers/bookingController.js'

const router = express.Router()

router.get('/', authenticate, listBookings)
router.post('/', authenticate, createBooking)
router.patch('/:id/accept', authenticate, acceptBooking)
router.patch('/:id/reject', authenticate, rejectBooking)
router.patch('/:id/complete', authenticate, completeBooking)
router.patch('/:id/verify', authenticate, verifyBooking)
router.patch('/:id/reject-verification', authenticate, rejectVerification)

export default router
