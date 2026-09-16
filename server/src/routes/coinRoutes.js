import { Router } from 'express'
import { authenticate, authorizeRole } from '../middleware/auth.js'
import {
  getCoinSettings,
  submitCoinPurchaseRequest,
  listCoinPurchaseRequests,
  reviewCoinPurchaseRequest,
  getUserCoinWallet,
  getUserCoinHistory,
  adminAdjustCoins,
  updateCoinLimit,
  updateCoinSettings,
  getWalletHistoryAdmin,
  getEmployerCoinInfo,
} from '../controllers/coinController.js'

const router = Router()
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])]

router.get('/settings', authenticate, getCoinSettings)
router.post('/purchase-request', authenticate, submitCoinPurchaseRequest)
router.get('/my-wallet', authenticate, getUserCoinWallet)
router.get('/my-history', authenticate, getUserCoinHistory)
router.get('/employer-info', authenticate, getEmployerCoinInfo)

router.get('/admin/requests', ...adminOnly, listCoinPurchaseRequests)
router.post('/admin/requests/:requestId/review', ...adminOnly, reviewCoinPurchaseRequest)
router.post('/admin/adjust', ...adminOnly, adminAdjustCoins)
router.post('/admin/limit', ...adminOnly, updateCoinLimit)
router.post('/settings', ...adminOnly, updateCoinSettings)
router.get('/admin/history', ...adminOnly, getWalletHistoryAdmin)

export default router
