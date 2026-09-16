import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as withdrawalController from '../controllers/withdrawalController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/', adminOnly, withdrawalController.getAll);
router.get('/:id', adminOnly, withdrawalController.getById);
router.post('/', adminOnly, withdrawalController.create);
router.patch('/:id/approve', adminOnly, withdrawalController.approve);
router.patch('/:id/reject', adminOnly, withdrawalController.reject);
router.patch('/:id/hold', adminOnly, withdrawalController.hold);
router.patch('/:id/release', adminOnly, withdrawalController.release);

export default router;
