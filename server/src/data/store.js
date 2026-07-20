const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const databaseFilePath = path.join(__dirname, 'database.json')

const createDefaultState = () => ({
  users: [],
  jobs: [],
  applications: [],
  reviews: [],
  notifications: [],
  messages: [],
  payments: [],
  purchases: [],
  posts: [],
})

const state = createDefaultState()

const loadStateFromDisk = () => {
  if (!fs.existsSync(databaseFilePath)) return null

  try {
    const raw = fs.readFileSync(databaseFilePath, 'utf8')
    if (!raw.trim()) return null

    const parsed = JSON.parse(raw)
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    }
  } catch (error) {
    console.error('Failed to load database file:', error.message)
    return null
  }
}

const persistState = () => {
  fs.writeFileSync(databaseFilePath, JSON.stringify(state, null, 2))
}

const initializeState = () => {
  const storedState = loadStateFromDisk()
  if (storedState) {
    Object.assign(state, storedState)
  }
}

initializeState()

const createUser = async ({
  name,
  email,
  password,
  role = 'worker',
  bio = '',
  location = '',
  skills = [],
  phone = '',
  username = '',
  address = '',
  profession = '',
  experience = [],
  education = [],
  certificates = [],
  portfolio = [],
  socialLinks = [],
  companyName = '',
  businessDetails = '',
  availability = 'Available now',
  notificationsEnabled = true,
  privacyMode = 'Private profile',
}) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = {
    id: `user_${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role,
    bio,
    location,
    skills,
    phone,
    username: username || name.toLowerCase().replace(/\s+/g, ''),
    address,
    profession,
    experience,
    education,
    certificates,
    portfolio,
    socialLinks,
    companyName,
    businessDetails,
    availability,
    notificationsEnabled,
    privacyMode,
    photo: '',
    ratings: 0,
    completedJobs: 0,
    earnings: 0,
    purchases: [],
    joinDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  state.users.push(user)
  persistState()
  return user
}

const getUserByEmail = async (email) => {
  const normalized = email?.trim().toLowerCase()
  return state.users.find((user) => user.email?.toLowerCase() === normalized)
}
const getUserByPhone = async (phone) => state.users.find((user) => user.phone === phone)
const getUserByUsername = async (username) => {
  const normalized = username?.trim().toLowerCase()
  return state.users.find((user) => user.username?.toLowerCase() === normalized)
}
const getUserByIdentifier = async (identifier) => {
  const normalized = identifier?.trim().toLowerCase()
  return (await getUserByEmail(normalized)) || (await getUserByPhone(identifier?.trim())) || (await getUserByUsername(normalized)) || null
}
const getUserById = (id) => state.users.find((user) => user.id === id)
const getUsers = () => state.users
const getWorkers = () => state.users.filter((user) => user.role === 'worker')
const getAllPurchases = () => state.purchases
const updateUser = (id, update) => {
  state.users = state.users.map((user) => (user.id === id ? { ...user, ...update } : user))
  persistState()
  return getUserById(id)
}
const deleteUser = (id) => {
  state.users = state.users.filter((user) => user.id !== id)
  persistState()
  return true
}

const getJobs = () => state.jobs
const createJob = (payload) => {
  const job = {
    id: `job_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.jobs.push(job)
  persistState()
  return job
}

const getJobById = (id) => state.jobs.find((job) => job.id === id)
const updateJob = (id, update) => {
  state.jobs = state.jobs.map((job) => (job.id === id ? { ...job, ...update } : job))
  return getJobById(id)
}
const deleteJob = (id) => {
  state.jobs = state.jobs.filter((job) => job.id !== id)
  persistState()
}

const createApplication = (payload) => {
  const application = {
    id: `application_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.applications.push(application)
  persistState()
  return application
}
const getApplicationsForUser = (userId) => state.applications.filter((application) => application.userId === userId)
const getApplicationsForJob = (jobId) => state.applications.filter((application) => application.jobId === jobId)

const createReview = (payload) => {
  const review = {
    id: `review_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.reviews.push(review)
  persistState()
  return review
}
const getReviews = () => state.reviews

const createNotification = (payload) => {
  const notification = {
    id: `notification_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.notifications.push(notification)
  persistState()
  return notification
}
const getNotificationsForUser = (userId) => state.notifications.filter((notification) => notification.userId === userId)
const getAllNotifications = () => state.notifications.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

const createPost = (payload) => {
  const post = {
    id: `post_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.posts.push(post)
  persistState()
  return post
}
const getPosts = () => state.posts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
const updatePost = (id, update) => {
  state.posts = state.posts.map((post) => (post.id === id ? { ...post, ...update } : post))
  persistState()
  return state.posts.find((post) => post.id === id)
}
const deletePost = (id) => {
  state.posts = state.posts.filter((post) => post.id !== id)
  persistState()
  return true
}

const createMessage = (payload) => {
  const message = {
    id: `message_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.messages.push(message)
  persistState()
  return message
}
const getMessages = (threadId) => state.messages.filter((message) => message.threadId === threadId)

const createPayment = (payload) => {
  const payment = {
    id: `payment_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.payments.push(payment)
  persistState()
  return payment
}
const getPaymentsForUser = (userId) => state.payments.filter((payment) => payment.userId === userId)

const createPurchase = (payload) => {
  const purchase = {
    id: `purchase_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  state.purchases.push(purchase)
  persistState()
  return purchase
}
const getPurchasesForUser = (userId) => state.purchases.filter((purchase) => purchase.userId === userId)

const deletePurchase = (userId, purchaseId) => {
  state.purchases = state.purchases.filter((purchase) => !(purchase.userId === userId && purchase.id === purchaseId))
  state.users = state.users.map((user) => {
    if (user.id !== userId) return user
    return {
      ...user,
      purchases: (user.purchases || []).filter((purchase) => purchase.id !== purchaseId),
    }
  })
  persistState()
  return state.purchases.filter((purchase) => purchase.userId === userId)
}

const resetState = () => {
  state.users = []
  state.jobs = []
  state.applications = []
  state.reviews = []
  state.notifications = []
  state.messages = []
  state.payments = []
  state.purchases = []
  state.posts = []
  persistState()
}

initializeState()

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
  createPost,
  getPosts,
  updatePost,
  deletePost,
  createMessage,
  getMessages,
  createPayment,
  getPaymentsForUser,
  createPurchase,
  getPurchasesForUser,
  deletePurchase,
  getAllPurchases,
  resetState,
}
