import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: {
    content: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['text', 'image', 'location'], default: 'text' },
    createdAt: { type: Date, default: Date.now },
  },
  unreadCount: { type: Number, default: 0 },
}, { timestamps: true })

conversationSchema.index({ participants: 1 })

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'location'], default: 'text' },
  seen: { type: Boolean, default: false },
  seenAt: Date,
}, { timestamps: true })

messageSchema.index({ conversationId: 1, createdAt: 1 })

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  amount: { type: Number, default: 0 },
  features: [{ type: String }],
}, { timestamps: true })

subscriptionSchema.index({ userId: 1 })

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entityType: { type: String, enum: ['user', 'job', 'message'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true })

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)
export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema)
export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema)
export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema)
