import UserActivity from '../models/UserActivity.js'

export const recordUserActivity = async ({ userId, username = '', fullName = '', email = '', role = 'user', action, entityType = 'general', entityId = '', entityTitle = '', details = '', ipAddress = '', deviceInfo = '' }) => {
  if (!userId || !action) {
    return null
  }

  return UserActivity.create({
    userId,
    username,
    fullName,
    email,
    role,
    action,
    entityType,
    entityId,
    entityTitle,
    details,
    ipAddress,
    deviceInfo,
  })
}

export default recordUserActivity
