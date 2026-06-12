const dataService = require('../services/dataService')

const updateProfile = async (req, res) => {
  const updatedUser = await dataService.updateUser(req.user.id, req.body)
  if (!updatedUser) {
    return res.status(404).json({ message: 'User not found' })
  }
  return res.json({ user: updatedUser })
}

module.exports = { updateProfile }
