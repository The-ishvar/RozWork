const dataService = require('../services/dataService')

const buildMonthlyGrowth = (users) => {
  const months = []
  const now = new Date()
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const label = date.toLocaleString('default', { month: 'short' })
    const count = users.filter((user) => {
      const createdAt = new Date(user.createdAt || user.joinDate || new Date())
      return createdAt.getMonth() === date.getMonth() && createdAt.getFullYear() === date.getFullYear()
    }).length
    months.push({ label, count })
  }
  return months
}

const buildTrend = (items, days) => {
  const now = new Date()
  const buckets = []
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - index)
    const label = date.toISOString().slice(0, 10)
    buckets.push({ label, count: 0 })
  }

  items.forEach((item) => {
    const createdAt = item.createdAt || item.created_at || item.joinDate || item.date
    if (!createdAt) return
    const iso = new Date(createdAt).toISOString().slice(0, 10)
    const match = buckets.find((entry) => entry.label === iso)
    if (match) match.count += 1
  })

  return buckets
}

const buildActivityFeed = (users, jobs, notifications, posts) => {
  const activities = []

  users.slice(0, 4).forEach((user) => {
    activities.push({
      id: `user-${user.id}`,
      type: 'registration',
      title: 'New user registration',
      message: `${user.name} joined the network as a ${user.role}.`,
      createdAt: user.createdAt || user.joinDate || new Date().toISOString(),
    })
  })

  jobs.slice(0, 4).forEach((job) => {
    activities.push({
      id: `job-${job.id}`,
      type: 'job',
      title: 'New job post',
      message: `${job.title} was posted in ${job.location || 'the marketplace'}.`,
      createdAt: job.createdAt || new Date().toISOString(),
    })
  })

  posts.slice(0, 4).forEach((post) => {
    activities.push({
      id: `post-${post.id}`,
      type: 'content',
      title: 'New content submitted',
      message: `${post.title} is waiting for approval.`,
      createdAt: post.createdAt || new Date().toISOString(),
    })
  })

  notifications.slice(0, 6).forEach((notification) => {
    activities.push({
      id: `notification-${notification.id}`,
      type: 'notification',
      title: 'Admin notification',
      message: notification.message,
      createdAt: notification.createdAt || new Date().toISOString(),
    })
  })

  return activities.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 12)
}

const buildPendingContent = (jobs, posts, users) => {
  const pending = []

  jobs.filter((job) => job.status === 'pending').forEach((job) => {
    pending.push({ id: job.id, type: 'job', title: job.title, status: 'pending', label: 'Pending job approval' })
  })

  posts.filter((post) => post.status === 'pending').forEach((post) => {
    pending.push({ id: post.id, type: 'post', title: post.title, status: 'pending', label: 'Pending content review' })
  })

  users.filter((user) => user.isVerified === false || user.isSuspended).forEach((user) => {
    pending.push({ id: user.id, type: 'user', title: user.name, status: 'review', label: 'Account review required' })
  })

  return pending.slice(0, 8)
}

const getUsers = async (req, res) => {
  const users = await dataService.getUsers()
  return res.json({ users })
}

const getStats = async (req, res) => {
  const [users, jobs, posts, notifications, purchases, loginLogs, registrationLogs, reviews] = await Promise.all([
    dataService.getUsers(),
    dataService.getJobs(),
    dataService.getPosts(),
    dataService.getAllNotifications(),
    dataService.getAllPurchases(),
    dataService.getAuditLogs({ type: 'login' }),
    dataService.getAuditLogs({ type: 'registration' }),
    dataService.getReviews(),
  ])

  const completedBookings = purchases.filter((purchase) => String(purchase.status || 'confirmed').toLowerCase() === 'completed').length
  const revenue = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || purchase.price || purchase.total || 0), 0)

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => !user.isBanned && !user.isSuspended).length,
    blockedUsers: users.filter((user) => user.isBanned || user.isSuspended).length,
    newRegistrations: registrationLogs.length,
    totalLogins: loginLogs.length,
    workers: users.filter((user) => user.role === 'worker').length,
    employers: users.filter((user) => user.role === 'employer').length,
    businesses: users.filter((user) => user.role === 'employer' || user.companyName).length,
    farmers: users.filter((user) => /farmer/i.test(user.profession || '') || /farmer/i.test(user.bio || '')).length,
    admins: users.filter((user) => user.role === 'admin' || user.role === 'super_admin').length,
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job) => job.status === 'approved').length,
    pendingJobs: jobs.filter((job) => job.status === 'pending').length,
    totalPosts: posts.length,
    totalNotifications: notifications.length,
    purchasesMade: purchases.length,
    completedBookings,
    totalRevenue: revenue,
    totalReviews: reviews.length,
    monthlyGrowth: buildMonthlyGrowth(users),
    weeklyTrend: buildTrend(users, 7),
    dailyBookings: buildTrend(purchases, 7),
    dailyJobs: buildTrend(jobs, 7),
  }

  return res.json({ stats })
}

const getOverview = async (req, res) => {
  const [users, jobs, posts, notifications, purchases, loginLogs, registrationLogs] = await Promise.all([
    dataService.getUsers(),
    dataService.getJobs(),
    dataService.getPosts(),
    dataService.getAllNotifications(),
    dataService.getAllPurchases(),
    dataService.getAuditLogs({ type: 'login' }),
    dataService.getAuditLogs({ type: 'registration' }),
  ])

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => !user.isBanned && !user.isSuspended).length,
    blockedUsers: users.filter((user) => user.isBanned || user.isSuspended).length,
    newRegistrations: registrationLogs.length,
    totalLogins: loginLogs.length,
    workers: users.filter((user) => user.role === 'worker').length,
    businesses: users.filter((user) => user.role === 'employer' || user.companyName).length,
    farmers: users.filter((user) => /farmer/i.test(user.profession || '') || /farmer/i.test(user.bio || '')).length,
    admins: users.filter((user) => user.role === 'admin' || user.role === 'super_admin').length,
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((job) => job.status === 'pending').length,
    totalPosts: posts.length,
    totalNotifications: notifications.length,
    purchasesMade: purchases.length,
    monthlyGrowth: buildMonthlyGrowth(users),
  }

  return res.json({
    stats,
    users,
    jobs,
    posts,
    notifications,
    activities: buildActivityFeed(users, jobs, notifications, posts),
    pendingContent: buildPendingContent(jobs, posts, users),
    recentPurchases: purchases.slice().reverse().slice(0, 8),
    auditLogs: [...loginLogs, ...registrationLogs].sort((left, right) => new Date(right.createdAt || right.created_at || 0) - new Date(left.createdAt || left.created_at || 0)).slice(0, 12),
  })
}

const updateUserStatus = async (req, res) => {
  const { status, role, ...profileUpdates } = req.body
  const updates = { ...profileUpdates }

  if (status === 'suspend') updates.isSuspended = true
  if (status === 'ban') updates.isBanned = true
  if (status === 'verify') updates.isVerified = true
  if (status === 'active') {
    updates.isSuspended = false
    updates.isBanned = false
    updates.isVerified = true
  }
  if (role) updates.role = role

  const updated = await dataService.updateUser(req.params.userId, updates)
  if (!updated) return res.status(404).json({ message: 'User not found' })
  await dataService.createNotification({
    userId: updated.id,
    type: 'account_update',
    message: `Your account status was updated to ${status || 'reviewed'}.`,
  })
  return res.json({ user: updated })
}

const deleteUser = async (req, res) => {
  const removed = await dataService.deleteUser(req.params.userId)
  if (!removed) return res.status(404).json({ message: 'User not found' })
  return res.json({ success: true })
}

const updateJobStatus = async (req, res) => {
  const { status } = req.body
  const updated = await dataService.updateJob(req.params.jobId, { status })
  if (!updated) return res.status(404).json({ message: 'Job not found' })
  return res.json({ job: updated })
}

const getContent = async (req, res) => {
  const posts = await dataService.getPosts()
  return res.json({ posts })
}

const createContent = async (req, res) => {
  const payload = {
    title: req.body.title,
    slug: req.body.slug || req.body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    excerpt: req.body.excerpt || '',
    body: req.body.body || '',
    category: req.body.category || 'general',
    status: req.body.status || 'pending',
    authorId: req.user?.id || '',
    authorName: req.user?.name || 'Super Admin',
  }

  const post = await dataService.createPost(payload)
  await dataService.createNotification({
    userId: req.user?.id || 'admin',
    type: 'content_pending',
    message: `New content submitted for review: ${payload.title}`,
  })
  return res.status(201).json({ post })
}

const updateContent = async (req, res) => {
  const updated = await dataService.updatePost(req.params.contentId, req.body)
  if (!updated) return res.status(404).json({ message: 'Post not found' })
  return res.json({ post: updated })
}

const deleteContent = async (req, res) => {
  const removed = await dataService.deletePost(req.params.contentId)
  if (!removed) return res.status(404).json({ message: 'Post not found' })
  return res.json({ success: true })
}

const getSettings = async (req, res) => {
  const settings = await dataService.getSettings()
  return res.json({ settings })
}

const updateSettings = async (req, res) => {
  const updated = await dataService.updateSettings(req.body)
  return res.json({ settings: updated })
}

const getNotifications = async (req, res) => {
  const notifications = await dataService.getAllNotifications()
  return res.json({ notifications })
}

const getAuditHistory = async (req, res) => {
  const { type = 'all', search = '' } = req.query
  const logs = await dataService.getAuditLogs({ type, search })
  return res.json({ logs })
}

const submitModerationAction = async (req, res) => {
  const { action, type, id } = req.body

  if (type === 'job' && id) {
    const job = await dataService.updateJob(id, { status: action === 'approve' ? 'approved' : 'rejected' })
    await dataService.createNotification({
      userId: req.user?.id || 'admin',
      type: 'job_moderated',
      message: `Job moderation ${action}d for ${job?.title || id}.`,
    })
    return res.json({ job })
  }

  if (type === 'post' && id) {
    const post = await dataService.updatePost(id, { status: action === 'approve' ? 'published' : 'rejected' })
    await dataService.createNotification({
      userId: req.user?.id || 'admin',
      type: 'content_moderated',
      message: `Content moderation ${action}d for ${post?.title || id}.`,
    })
    return res.json({ post })
  }

  if (type === 'user' && id) {
    const user = await dataService.updateUser(id, { isVerified: action === 'approve' })
    await dataService.createNotification({
      userId: user.id,
      type: 'account_update',
      message: `Your account was ${action === 'approve' ? 'verified' : 'reviewed'} by the admin team.`,
    })
    return res.json({ user })
  }

  return res.status(400).json({ message: 'Unsupported moderation action' })
}

const bulkAction = async (req, res) => {
  const { action, type } = req.body
  if (type === 'jobs') {
    const jobs = await dataService.getJobs()
    for (const job of jobs) {
      await dataService.updateJob(job.id, { status: action === 'approve' ? 'approved' : 'rejected' })
    }
    return res.json({ success: true })
  }

  if (type === 'posts') {
    const posts = await dataService.getPosts()
    for (const post of posts) {
      await dataService.updatePost(post.id, { status: action === 'approve' ? 'published' : 'rejected' })
    }
    return res.json({ success: true })
  }

  if (type === 'users') {
    const users = await dataService.getUsers()
    for (const user of users) {
      await dataService.updateUser(user.id, { isVerified: action === 'approve' })
    }
    return res.json({ success: true })
  }

  return res.status(400).json({ message: 'Unsupported bulk action' })
}

module.exports = {
  getUsers,
  getStats,
  getOverview,
  updateUserStatus,
  deleteUser,
  updateJobStatus,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getSettings,
  updateSettings,
  getNotifications,
  getAuditHistory,
  submitModerationAction,
  bulkAction,
}
