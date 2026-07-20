import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  createBooking,
  getBookingById,
  listBookings,
  rejectBooking,
  rejectVerification,
  requestRefund,
  verifyBooking,
} from '../controllers/bookingController.js'

const router = express.Router()

router.get('/', authenticate, listBookings)
router.get('/:id', authenticate, getBookingById)
router.post('/', authenticate, createBooking)
router.patch('/:id/accept', authenticate, acceptBooking)
router.patch('/:id/reject', authenticate, rejectBooking)
router.patch('/:id/complete', authenticate, completeBooking)
router.patch('/:id/verify', authenticate, verifyBooking)
router.patch('/:id/reject-verification', authenticate, rejectVerification)
router.patch('/:id/cancel', authenticate, cancelBooking)
router.patch('/:id/refund', authenticate, requestRefund)

export default router
