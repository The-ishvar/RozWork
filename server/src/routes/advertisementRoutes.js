import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as advertisementController from '../controllers/advertisementController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/', adminOnly, advertisementController.getAll);
router.get('/:id', adminOnly, advertisementController.getById);
router.post('/', adminOnly, advertisementController.create);
router.put('/:id', adminOnly, advertisementController.update);
router.delete('/:id', adminOnly, advertisementController.remove);
router.patch('/:id/activate', adminOnly, advertisementController.activate);
router.patch('/:id/pause', adminOnly, advertisementController.pause);

export default router;
