import express from 'express'
import { createGalleryItem, deleteGalleryItem, getGallery, updateGalleryItem } from '../controllers/galleryController.js'
import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getGallery)
router.post('/', authenticate, authorizeRole(['admin', 'super_admin']), createGalleryItem)
router.patch('/:id', authenticate, authorizeRole(['admin', 'super_admin']), updateGalleryItem)
router.delete('/:id', authenticate, authorizeRole(['admin', 'super_admin']), deleteGalleryItem)

export default router
