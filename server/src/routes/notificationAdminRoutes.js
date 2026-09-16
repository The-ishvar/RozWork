import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as notificationAdminController from '../controllers/notificationAdminController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/stats', adminOnly, notificationAdminController.getNotificationStats);
router.post('/send-bulk', adminOnly, notificationAdminController.sendBulk);
router.post('/send-all', adminOnly, notificationAdminController.sendToAll);
router.post('/send-role', adminOnly, notificationAdminController.sendToRole);
router.post('/send-user', adminOnly, notificationAdminController.sendToUser);

export default router;
