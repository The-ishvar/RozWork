import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, default: '' },
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    role: { type: String, default: 'user' },
    action: { type: String, required: true },
    entityType: { type: String, default: 'general' },
    entityId: { type: String, default: '' },
    entityTitle: { type: String, default: '' },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
  },
  { timestamps: true },
)

const UserActivity = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema)

export default UserActivity
