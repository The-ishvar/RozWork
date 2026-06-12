const express = require('express')
const { search, listCategories, getSettings, updateSettings } = require('../controllers/searchController')
const { authenticate, authorizeRole } = require('../middleware/auth')

const router = express.Router()

router.get('/', search)
router.get('/categories', listCategories)
router.get('/settings', getSettings)
router.put('/settings', authenticate, authorizeRole(['admin']), updateSettings)

module.exports = router
