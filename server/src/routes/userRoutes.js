const express = require('express')
const { updateProfile } = require('../controllers/userController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.put('/profile', authenticate, updateProfile)

module.exports = router
