import { getUserById, updateUser } from '../data/localStore.js'

export const saveUserData = async (req, res) => {
  const payload = req.body

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ message: 'Data payload is required' })
  }

  const user = getUserById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const updatedUser = updateUser(req.user.id, { ...user, data: payload })
  console.log('User data saved successfully')
  return res.status(201).json({ message: 'User data saved successfully', data: updatedUser.data || {} })
}

export const getUserData = async (req, res) => {
  const user = getUserById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ data: user.data || {} })
}
