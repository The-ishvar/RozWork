import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as analyticsController from '../controllers/analyticsController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/revenue/daily', adminOnly, analyticsController.getDailyRevenue);
router.get('/revenue/monthly', adminOnly, analyticsController.getMonthlyRevenue);
router.get('/revenue/source', adminOnly, analyticsController.getRevenueBySource);
router.get('/workers/top', adminOnly, analyticsController.getTopWorkers);
router.get('/employers/top', adminOnly, analyticsController.getTopEmployers);
router.get('/products/top', adminOnly, analyticsController.getTopProducts);
router.get('/categories/top', adminOnly, analyticsController.getTopCategories);
router.get('/users/active', adminOnly, analyticsController.getMostActiveUsers);
router.get('/dashboard', adminOnly, analyticsController.getDashboardCharts);

export default router;
