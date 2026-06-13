import Notification from '../models/Notification.js'

const serializeNotification = (notification) => ({
  id: notification._id ? notification._id.toString() : notification.id,
  userId: notification.userId ? notification.userId.toString() : '',
  fromUserId: notification.fromUserId ? notification.fromUserId.toString() : null,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  relatedId: notification.relatedId ? notification.relatedId.toString() : null,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
})

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
    return res.json({ notifications: notifications.map(serializeNotification) })
  } catch (error) {
    console.error('notifications.list failed', error)
    next(error)
  }
}

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isRead: true }, { new: true })
    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    return res.json({ notification: serializeNotification(notification) })
  } catch (error) {
    console.error('notifications.markRead failed', error)
    next(error)
  }
}

export default { listNotifications, markNotificationRead }
