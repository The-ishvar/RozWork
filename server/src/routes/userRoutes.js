import express from 'express'
import { updatePassword, updateProfile } from '../controllers/userController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.put('/profile', authenticate, updateProfile)
router.put('/password', authenticate, updatePassword)

export default router
