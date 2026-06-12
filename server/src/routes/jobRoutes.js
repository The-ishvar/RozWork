const express = require('express')
const { listJobs, createJob, getJobById, updateJob, deleteJob, applyToJob, getApplications } = require('../controllers/jobController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.post('/create', authenticate, createJob)
router.get('/applications', authenticate, getApplications)
router.get('/', listJobs)
router.get('/:id', getJobById)
router.put('/:id', authenticate, updateJob)
router.delete('/:id', authenticate, deleteJob)
router.post('/', authenticate, createJob)
router.post('/:jobId/apply', authenticate, applyToJob)

module.exports = router
