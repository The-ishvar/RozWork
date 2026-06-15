import express from 'express'
import {
  getUsers,
  getLoginHistory,
  getUserActivities,
  getStats,
  getOverview,
  updateUserStatus,
  deleteUser,
  updateJob,
  updateJobStatus,
  deleteJob,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getSettings,
  updateSettings,
  getNotifications,
  getAuditHistory,
  getBookingTracking,
  submitModerationAction,
  bulkAction,
} from '../controllers/adminController.js'
import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router()

const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])]
const superAdminOnly = [authenticate, authorizeRole(['super_admin'])]

router.get('/users', ...adminOnly, getUsers)
router.get('/login-history', ...adminOnly, getLoginHistory)
router.get('/activities', ...adminOnly, getUserActivities)
router.get('/stats', ...adminOnly, getStats)
router.get('/overview', ...adminOnly, getOverview)
router.patch('/users/:userId', ...adminOnly, updateUserStatus)
router.delete('/users/:userId', ...adminOnly, deleteUser)
router.patch('/jobs/:jobId', ...adminOnly, updateJob)
router.patch('/jobs/:jobId/status', ...adminOnly, updateJobStatus)
router.delete('/jobs/:jobId', ...adminOnly, deleteJob)
router.get('/content', ...adminOnly, getContent)
router.post('/content', ...adminOnly, createContent)
router.patch('/content/:contentId', ...adminOnly, updateContent)
router.delete('/content/:contentId', ...adminOnly, deleteContent)
router.get('/settings', ...adminOnly, getSettings)
router.put('/settings', ...adminOnly, updateSettings)
router.get('/notifications', ...adminOnly, getNotifications)
router.get('/audit', ...superAdminOnly, getAuditHistory)
router.get('/bookings/tracking', ...superAdminOnly, getBookingTracking)
router.post('/moderation', ...adminOnly, submitModerationAction)
router.post('/bulk-action', ...adminOnly, bulkAction)

export default router
