import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as reelController from '../controllers/reelController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/', adminOnly, reelController.getAll);
router.get('/:id', adminOnly, reelController.getById);
router.post('/', adminOnly, reelController.create);
router.put('/:id', adminOnly, reelController.update);
router.delete('/:id', adminOnly, reelController.remove);
router.patch('/:id/approve', adminOnly, reelController.approve);
router.patch('/:id/reject', adminOnly, reelController.reject);
router.patch('/:id/hide', adminOnly, reelController.hide);
router.patch('/:id/feature', adminOnly, reelController.feature);
router.patch('/:id/trending', adminOnly, reelController.trending);

export default router;
