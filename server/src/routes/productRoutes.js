import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import * as productController from '../controllers/productController.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])];

router.get('/', adminOnly, productController.getAll);
router.get('/:id', adminOnly, productController.getById);
router.post('/', adminOnly, productController.create);
router.put('/:id', adminOnly, productController.update);
router.delete('/:id', adminOnly, productController.remove);
router.patch('/:id/approve', adminOnly, productController.approve);
router.patch('/:id/reject', adminOnly, productController.reject);
router.patch('/:id/feature', adminOnly, productController.feature);

export default router;
