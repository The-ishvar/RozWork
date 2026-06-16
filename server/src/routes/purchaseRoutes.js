import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { createPurchase, deletePurchase, listPurchases, purchasePremiumMembership } from '../controllers/purchaseController.js'

const router = express.Router()

router.get('/', authenticate, listPurchases)
router.post('/', authenticate, createPurchase)
router.post('/premium', authenticate, purchasePremiumMembership)
router.delete('/:id', authenticate, deletePurchase)

export default router
