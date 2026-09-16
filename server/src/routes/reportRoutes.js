import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as reportController from '../controllers/reportController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/stats', adminOnly, reportController.getReportStats);
router.get('/type/:type', adminOnly, reportController.getReportsByType);
router.get('/', adminOnly, reportController.getAll);
router.get('/:id', adminOnly, reportController.getById);
router.patch('/:id/status', adminOnly, reportController.updateStatus);

export default router;
