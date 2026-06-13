import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js'

const router = express.Router()

router.get('/', authenticate, listNotifications)
router.patch('/:id/read', authenticate, markNotificationRead)

export default router
