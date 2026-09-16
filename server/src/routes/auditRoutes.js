import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as auditController from '../controllers/auditController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/summary', adminOnly, auditController.getActivitySummary);
router.get('/failed-logins', adminOnly, auditController.getFailedLogins);
router.get('/ip-tracking', adminOnly, auditController.getIPTracking);
router.get('/device-tracking', adminOnly, auditController.getDeviceTracking);
router.get('/logs', adminOnly, auditController.getAuditLogs);

export default router;
