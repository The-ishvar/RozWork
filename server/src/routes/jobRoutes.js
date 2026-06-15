import express from 'express'
import { listJobs, createJob, getJobById, updateJob, deleteJob, applyToJob, getApplications, getMyJobs } from '../controllers/jobController.js'
import { authenticate, authorizeRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', authenticate, authorizeRole(['employer', 'admin', 'super_admin']), createJob)
router.get('/applications', authenticate, getApplications)
router.get('/mine', authenticate, getMyJobs)
router.get('/', listJobs)
router.get('/:id', getJobById)
router.put('/:id', authenticate, updateJob)
router.delete('/:id', authenticate, deleteJob)
router.post('/', authenticate, authorizeRole(['employer', 'admin', 'super_admin']), createJob)
router.post('/:jobId/apply', authenticate, applyToJob)

export default router
