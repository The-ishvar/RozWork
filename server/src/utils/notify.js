import Notification from '../models/Notification.js'
import User from '../models/User.js'

export const notifyAdmins = async ({ type = 'info', title = 'Notification', message, relatedId = null, fromUserId = null }) => {
  if (!message) return []

  const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).lean()
  if (!admins.length) return []

  return Promise.all(
    admins.map((admin) =>
      Notification.create({
        userId: admin._id,
        fromUserId,
        type,
        title,
        message,
        relatedId,
      }),
    ),
  )
}

export const createNotification = async ({ userId, type = 'info', title = 'Notification', message, relatedId = null, fromUserId = null }) => {
  if (!userId || !message) return null

  return Notification.create({
    userId,
    fromUserId,
    type,
    title,
    message,
    relatedId,
  })
}
