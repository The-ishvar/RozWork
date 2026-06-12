import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getUserData, saveUserData } from '../controllers/dataController.js'

const router = express.Router()

router.post('/data', authenticate, saveUserData)
router.get('/data', authenticate, getUserData)

export default router
