import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as subscriptionPlanController from '../controllers/subscriptionPlanController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/', adminOnly, subscriptionPlanController.getAll);
router.get('/:id', adminOnly, subscriptionPlanController.getById);
router.post('/', adminOnly, subscriptionPlanController.create);
router.put('/:id', adminOnly, subscriptionPlanController.update);
router.delete('/:id', adminOnly, subscriptionPlanController.remove);

export default router;
