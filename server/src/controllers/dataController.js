import User from '../models/User.js'

export const saveUserData = async (req, res) => {
  const payload = req.body

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ message: 'Data payload is required' })
  }

  const user = await User.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  user.data = payload
  await user.save()
  console.log('User data saved successfully')
  return res.status(201).json({ message: 'User data saved successfully', data: user.data || {} })
}

export const getUserData = async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ data: user.data || {} })
}
