const mongoose = require('mongoose')

const { Schema } = mongoose

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker', 'employer', 'admin', 'super_admin'], default: 'worker' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  skills: { type: [String], default: [] },
  phone: { type: String, default: '' },
  username: { type: String, default: '' },
  address: { type: String, default: '' },
  profession: { type: String, default: '' },
  experience: { type: [String], default: [] },
  education: { type: [String], default: [] },
  certificates: { type: [String], default: [] },
  projects: { type: [Object], default: [] },
  resumeUrl: { type: String, default: '' },
  portfolio: { type: [String], default: [] },
  socialLinks: { type: [String], default: [] },
  companyName: { type: String, default: '' },
  businessDetails: { type: String, default: '' },
  availability: { type: String, default: 'Available now' },
  notificationsEnabled: { type: Boolean, default: true },
  privacyMode: { type: String, default: 'Private profile' },
  photo: { type: String, default: '' },
  ratings: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  purchases: { type: [Object], default: [] },
  lastPurchase: { type: Object, default: null },
  isVerified: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  joinDate: { type: Date, default: Date.now },
}, { timestamps: true })

const jobSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  salary: { type: String, default: '' },
  description: { type: String, default: '' },
  postedBy: { type: String, default: '' },
  postedByRole: { type: String, default: 'employer' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'expired'], default: 'approved' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

const applicationSchema = new Schema({
  jobId: { type: String, required: true },
  userId: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

const reviewSchema = new Schema({
  userId: { type: String, required: true },
  targetId: { type: String, default: '' },
  rating: { type: Number, default: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

const notificationSchema = new Schema({
  userId: { type: String, required: true },
  type: { type: String, default: 'info' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

const messageSchema = new Schema({
  threadId: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, { timestamps: true })

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, default: '' },
}, { timestamps: true })

const postSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true },
  excerpt: { type: String, default: '' },
  body: { type: String, default: '' },
  category: { type: String, default: 'general' },
  status: { type: String, enum: ['draft', 'published', 'pending'], default: 'pending' },
  authorId: { type: String, default: '' },
  authorName: { type: String, default: 'Super Admin' },
}, { timestamps: true })

const auditLogSchema = new Schema({
  type: { type: String, enum: ['login', 'registration'], default: 'login' },
  userId: { type: String, default: '' },
  userName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  username: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  browser: { type: String, default: '' },
  deviceType: { type: String, default: '' },
  details: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

module.exports = {
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Job: mongoose.models.Job || mongoose.model('Job', jobSchema),
  Application: mongoose.models.Application || mongoose.model('Application', applicationSchema),
  Review: mongoose.models.Review || mongoose.model('Review', reviewSchema),
  Notification: mongoose.models.Notification || mongoose.model('Notification', notificationSchema),
  Message: mongoose.models.Message || mongoose.model('Message', messageSchema),
  Category: mongoose.models.Category || mongoose.model('Category', categorySchema),
  Setting: mongoose.models.Setting || mongoose.model('Setting', settingSchema),
  Post: mongoose.models.Post || mongoose.model('Post', postSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema),
}
