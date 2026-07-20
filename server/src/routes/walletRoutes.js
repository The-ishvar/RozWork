import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getWalletBalance,
  getWalletTransactions,
  topUpWallet,
  withdrawFromWallet,
} from '../controllers/walletController.js'

const router = express.Router()

router.get('/balance', authenticate, getWalletBalance)
router.get('/transactions', authenticate, getWalletTransactions)
router.post('/topup', authenticate, topUpWallet)
router.post('/withdraw', authenticate, withdrawFromWallet)

export default router
