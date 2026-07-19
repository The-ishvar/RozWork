import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getConversations, getMessages, createConversation, sendMessage, markSeen
} from '../controllers/chatController.js'

const router = Router()

router.get('/conversations', authenticate, getConversations)
router.get('/messages/:conversationId', authenticate, getMessages)
router.post('/conversations', authenticate, createConversation)
router.post('/messages', authenticate, sendMessage)
router.patch('/messages/:conversationId/seen', authenticate, markSeen)

export default router
