const express = require('express')
const {
  getUsers,
  getStats,
  getOverview,
  updateUserStatus,
  deleteUser,
  updateJobStatus,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getSettings,
  updateSettings,
  getNotifications,
  getAuditHistory,
  submitModerationAction,
  bulkAction,
} = require('../controllers/adminController')
const { authenticate, authorizeRole } = require('../middleware/auth')

const router = express.Router()

const adminOnly = [authenticate, authorizeRole(['admin', 'super_admin'])]
const superAdminOnly = [authenticate, authorizeRole(['super_admin'])]

router.get('/users', ...adminOnly, getUsers)
router.get('/stats', ...adminOnly, getStats)
router.get('/overview', ...adminOnly, getOverview)
router.patch('/users/:userId', ...adminOnly, updateUserStatus)
router.delete('/users/:userId', ...adminOnly, deleteUser)
router.patch('/jobs/:jobId/status', ...adminOnly, updateJobStatus)
router.get('/content', ...adminOnly, getContent)
router.post('/content', ...adminOnly, createContent)
router.patch('/content/:contentId', ...adminOnly, updateContent)
router.delete('/content/:contentId', ...adminOnly, deleteContent)
router.get('/settings', ...adminOnly, getSettings)
router.put('/settings', ...adminOnly, updateSettings)
router.get('/notifications', ...adminOnly, getNotifications)
router.get('/audit', ...superAdminOnly, getAuditHistory)
router.post('/moderation', ...adminOnly, submitModerationAction)
router.post('/bulk-action', ...adminOnly, bulkAction)

module.exports = router
