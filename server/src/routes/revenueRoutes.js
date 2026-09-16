import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as revenueController from '../controllers/revenueController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/stats', adminOnly, revenueController.getRevenueStats);
router.get('/by-source', adminOnly, revenueController.getRevenueBySource);
router.get('/by-period', adminOnly, revenueController.getRevenueByPeriod);
router.get('/', adminOnly, revenueController.getAll);

export default router;
