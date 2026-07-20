import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  createOrder,
  getMyPayments,
  getPaymentMethods,
  getPaymentStatus,
  verifyPayment,
} from '../controllers/paymentController.js'

const router = express.Router()

router.get('/methods', getPaymentMethods)
router.get('/my', authenticate, getMyPayments)
router.get('/status/:bookingId', authenticate, getPaymentStatus)
router.post('/create-order', authenticate, createOrder)
router.post('/verify', authenticate, verifyPayment)

export default router
