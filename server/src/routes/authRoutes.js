import express from 'express'
import { forgotPassword, login, me, register, resetPassword, verifyOtp } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.post('/verify-otp', asyncHandler(verifyOtp))
router.post('/reset-password', asyncHandler(resetPassword))
router.get('/me', authenticate, asyncHandler(me))

export default router
