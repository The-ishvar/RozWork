import express from 'express'
import { listJobs, createJob, getJobById, updateJob, deleteJob, applyToJob, getApplications } from '../controllers/jobController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', authenticate, createJob)
router.get('/applications', authenticate, getApplications)
router.get('/', listJobs)
router.get('/:id', getJobById)
router.put('/:id', authenticate, updateJob)
router.delete('/:id', authenticate, deleteJob)
router.post('/', authenticate, createJob)
router.post('/:jobId/apply', authenticate, applyToJob)

export default router
