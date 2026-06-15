import mongoose from 'mongoose'

const loginHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, default: '' },
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    role: { type: String, default: 'user' },
    loginAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
  },
  { timestamps: true },
)

const LoginHistory = mongoose.models.LoginHistory || mongoose.model('LoginHistory', loginHistorySchema)

export default LoginHistory
