import User from '../models/User.js'
import { notifyAdmins } from '../utils/notify.js'

export const updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body }
    delete updates.password

    if (updates.location === undefined && updates.address !== undefined) {
      updates.location = updates.address
    }

    if (updates.address !== undefined) {
      delete updates.address
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: String(updates.email).trim().toLowerCase(), _id: { $ne: user._id } })
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'That email is already in use', code: 'EMAIL_EXISTS' })
      }
    }

    if (updates.phone && updates.phone !== user.phone) {
      const existingUser = await User.findOne({ phone: String(updates.phone).trim(), _id: { $ne: user._id } })
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'That phone number is already in use', code: 'PHONE_EXISTS' })
      }
    }

    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ username: String(updates.username).trim(), _id: { $ne: user._id } })
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'That username is already in use', code: 'USERNAME_EXISTS' })
      }
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) return
      user[key] = value
    })

    await user.save()

    await notifyAdmins({
      type: 'profile',
      title: 'Profile updated',
      message: `${user.name || 'A user'} updated their RozWork profile.`,
      relatedId: user._id,
      fromUserId: user._id,
    })

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        ...user.toObject(),
        id: user._id.toString(),
      },
    })
  } catch (error) {
    console.error('user.updateProfile failed', error)
    next(error)
  }
}

export default { updateProfile }
