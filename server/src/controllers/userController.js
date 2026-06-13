import User from '../models/User.js'

export const updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body }
    delete updates.password
    delete updates.email

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({ user: updatedUser })
  } catch (error) {
    console.error('user.updateProfile failed', error)
    next(error)
  }
}

export default { updateProfile }
