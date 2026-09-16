import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as walletAdminController from '../controllers/walletAdminController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/', adminOnly, walletAdminController.getAllWallets);
router.get('/:userId/history', adminOnly, walletAdminController.getWalletHistory);
router.post('/add-money', adminOnly, walletAdminController.addMoney);
router.post('/remove-money', adminOnly, walletAdminController.removeMoney);
router.post('/hold', adminOnly, walletAdminController.holdBalance);
router.post('/release', adminOnly, walletAdminController.releaseBalance);

export default router;
