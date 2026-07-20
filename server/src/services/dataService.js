const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { connectToDatabase } = require('../db')
const localStore = require('../data/store')
const { User, Job, Application, Review, Notification, Message, Category, Setting, Post, AuditLog } = require('../models')

const shouldUseMongo = () => Boolean(process.env.MONGO_URI && process.env.USE_MONGO !== 'false')
const inMemoryAuditLogs = []

const toPublicUser = (user) => {
  if (!user) return null
  const plain = user.toObject ? user.toObject({ versionKey: false }) : { ...user }
  const { password, ...rest } = plain
  return { ...rest, id: plain.id || plain._id?.toString?.() || plain._id }
}

const toInternalUser = (user) => {
  if (!user) return null
  const plain = user.toObject ? user.toObject({ versionKey: false }) : { ...user }
  return { ...plain, id: plain.id || plain._id?.toString?.() || plain._id }
}

const toPublicJob = (job) => {
  if (!job) return null
  const plain = job.toObject ? job.toObject({ versionKey: false }) : { ...job }
  return { ...plain, id: plain.id || plain._id?.toString?.() || plain._id }
}

const ensureMongoReady = async () => {
  if (!shouldUseMongo()) return false
  if (mongoose.connection.readyState === 1) return true
  try {
    await connectToDatabase()
    return mongoose.connection.readyState === 1
  } catch (error) {
    console.warn('MongoDB unavailable, using local store fallback:', error.message)
    return false
  }
}

const createUser = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const hashedPassword = await bcrypt.hash(payload.password, 10)
    const user = await User.create({ ...payload, password: hashedPassword })
    return toInternalUser(user)
  }
  return localStore.createUser(payload)
}

const getUserByEmail = async (email) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const user = await User.findOne({ email: email?.toLowerCase() })
    return user ? toInternalUser(user) : null
  }
  return localStore.getUserByEmail(email)
}

const getUserByPhone = async (phone) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const user = await User.findOne({ phone })
    return user ? toPublicUser(user) : null
  }
  return localStore.getUserByPhone(phone)
}

const getUserByIdentifier = async (identifier) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const normalized = identifier?.trim().toLowerCase()
    const user = await User.findOne({
      $or: [
        { email: normalized },
        { phone: identifier?.trim() },
        { username: normalized },
      ],
    })
    return user ? toInternalUser(user) : null
  }
  return localStore.getUserByIdentifier(identifier)
}

const getUserById = async (id) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const user = await User.findById(id)
    return user ? toInternalUser(user) : null
  }
  return localStore.getUserById(id)
}

const getUsers = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const users = await User.find({}).sort({ createdAt: -1 })
    return users.map((user) => toPublicUser(user))
  }
  return localStore.getUsers()
}

const getWorkers = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const workers = await User.find({ role: 'worker' }).sort({ createdAt: -1 })
    return workers.map((worker) => toPublicUser(worker))
  }
  return localStore.getWorkers()
}

const updateUser = async (id, update) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const updated = await User.findByIdAndUpdate(id, update, { new: true })
    return updated ? toPublicUser(updated) : null
  }
  return localStore.updateUser(id, update)
}

const deleteUser = async (id) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    await User.findByIdAndDelete(id)
    return true
  }
  return localStore.deleteUser(id)
}

const getJobs = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const jobs = await Job.find({}).sort({ createdAt: -1 })
    return jobs.map((job) => toPublicJob(job))
  }
  return localStore.getJobs()
}

const createJob = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const job = await Job.create(payload)
    return toPublicJob(job)
  }
  return localStore.createJob(payload)
}

const getJobById = async (id) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const job = await Job.findById(id)
    return job ? toPublicJob(job) : null
  }
  return localStore.getJobById(id)
}

const updateJob = async (id, update) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const updated = await Job.findByIdAndUpdate(id, update, { new: true })
    return updated ? toPublicJob(updated) : null
  }
  return localStore.updateJob(id, update)
}

const deleteJob = async (id) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    await Job.findByIdAndDelete(id)
    return true
  }
  return localStore.deleteJob(id)
}

const createApplication = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const application = await Application.create(payload)
    return application.toObject({ versionKey: false })
  }
  return localStore.createApplication(payload)
}

const getApplicationsForUser = async (userId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const applications = await Application.find({ userId }).sort({ createdAt: -1 })
    return applications.map((item) => item.toObject({ versionKey: false }))
  }
  return localStore.getApplicationsForUser(userId)
}

const getApplicationsForJob = async (jobId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const applications = await Application.find({ jobId }).sort({ createdAt: -1 })
    return applications.map((item) => item.toObject({ versionKey: false }))
  }
  return localStore.getApplicationsForJob(jobId)
}

const createReview = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const review = await Review.create(payload)
    return review.toObject({ versionKey: false })
  }
  return localStore.createReview(payload)
}

const getReviews = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const reviews = await Review.find({}).sort({ createdAt: -1 })
    return reviews.map((review) => review.toObject({ versionKey: false }))
  }
  return localStore.getReviews()
}

const createNotification = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const notification = await Notification.create(payload)
    return notification.toObject({ versionKey: false })
  }
  return localStore.createNotification(payload)
}

const getNotificationsForUser = async (userId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 })
    return notifications.map((item) => item.toObject({ versionKey: false }))
  }
  return localStore.getNotificationsForUser(userId)
}

const getAllNotifications = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const notifications = await Notification.find({}).sort({ createdAt: -1 })
    return notifications.map((item) => item.toObject({ versionKey: false }))
  }
  return localStore.getAllNotifications()
}

const createMessage = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const message = await Message.create(payload)
    return message.toObject({ versionKey: false })
  }
  return localStore.createMessage(payload)
}

const getMessages = async (threadId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const messages = await Message.find({ threadId }).sort({ createdAt: 1 })
    return messages.map((item) => item.toObject({ versionKey: false }))
  }
  return localStore.getMessages(threadId)
}

const createPayment = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    return { id: new mongoose.Types.ObjectId().toString(), ...payload, createdAt: new Date().toISOString() }
  }
  return localStore.createPayment(payload)
}

const getPaymentsForUser = async (userId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    return []
  }
  return localStore.getPaymentsForUser(userId)
}

const createPurchase = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const purchase = { id: new mongoose.Types.ObjectId().toString(), ...payload, createdAt: new Date().toISOString() }
    return purchase
  }
  return localStore.createPurchase(payload)
}

const getPurchasesForUser = async (userId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const user = await User.findById(userId)
    return user?.purchases || []
  }
  return localStore.getPurchasesForUser(userId)
}

const deletePurchase = async (userId, purchaseId) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const user = await User.findById(userId)
    if (!user) return []

    const updatedPurchases = (user.purchases || []).filter((purchase) => purchase.id !== purchaseId && purchase._id?.toString?.() !== purchaseId)
    await User.findByIdAndUpdate(userId, { purchases: updatedPurchases })
    return updatedPurchases
  }
  return localStore.deletePurchase(userId, purchaseId)
}

const getAllPurchases = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const users = await User.find({})
    return users.flatMap((user) => (user.purchases || []).map((purchase) => ({ ...purchase, userId: user._id.toString() })))
  }
  return localStore.getAllPurchases()
}

const listCategories = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const categories = await Category.find({}).sort({ createdAt: -1 })
    return categories.map((category) => category.toObject({ versionKey: false }))
  }
  return localStore.getJobs ? [] : []
}

const createCategory = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const category = await Category.create(payload)
    return category.toObject({ versionKey: false })
  }
  return payload
}

const getSettings = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const settings = await Setting.find({})
    return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]))
  }
  return {}
}

const updateSettings = async (updates) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const entries = Object.entries(updates)
    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
    }
    return getSettings()
  }
  return { ...updates }
}

const createAuditLog = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const auditLog = await AuditLog.create(payload)
    return auditLog.toObject({ versionKey: false })
  }

  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  inMemoryAuditLogs.unshift(entry)
  return entry
}

const getAuditLogs = async ({ type, search } = {}) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const query = {}
    if (type && type !== 'all') query.type = type
    const logs = await AuditLog.find(query).sort({ createdAt: -1 })
    return logs.map((entry) => entry.toObject({ versionKey: false }))
  }

  return inMemoryAuditLogs.filter((entry) => {
    if (type && type !== 'all' && entry.type !== type) return false
    if (!search) return true
    const haystack = [entry.userName, entry.email, entry.phone, entry.username, entry.ipAddress, entry.browser, entry.deviceType, entry.details?.role].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })
}

const createPost = async (payload) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const post = await Post.create(payload)
    return post.toObject({ versionKey: false })
  }
  return localStore.createPost(payload)
}

const getPosts = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const posts = await Post.find({}).sort({ createdAt: -1 })
    return posts.map((post) => post.toObject({ versionKey: false }))
  }
  return localStore.getPosts()
}

const updatePost = async (id, update) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    const updated = await Post.findByIdAndUpdate(id, update, { new: true })
    return updated ? updated.toObject({ versionKey: false }) : null
  }
  return localStore.updatePost(id, update)
}

const deletePost = async (id) => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    await Post.findByIdAndDelete(id)
    return true
  }
  return localStore.deletePost(id)
}

const resetState = async () => {
  const mongoReady = await ensureMongoReady()
  if (mongoReady) {
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Message.deleteMany({}),
      Category.deleteMany({}),
      Setting.deleteMany({}),
      Post.deleteMany({}),
      AuditLog.deleteMany({}),
    ])
    return true
  }
  inMemoryAuditLogs.length = 0
  return localStore.resetState()
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserByPhone,
  getUserByIdentifier,
  getUserById,
  getUsers,
  getWorkers,
  updateUser,
  deleteUser,
  getJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  createApplication,
  getApplicationsForUser,
  getApplicationsForJob,
  createReview,
  getReviews,
  createNotification,
  getNotificationsForUser,
  getAllNotifications,
  createAuditLog,
  getAuditLogs,
  createMessage,
  getMessages,
  createPayment,
  getPaymentsForUser,
  createPurchase,
  getPurchasesForUser,
  deletePurchase,
  getAllPurchases,
  listCategories,
  createCategory,
  getSettings,
  updateSettings,
  createPost,
  getPosts,
  updatePost,
  deletePost,
  resetState,
}
