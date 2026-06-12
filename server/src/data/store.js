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
    return
  }

  seedDemoUser()
  seedAdminUser()
  seedQuickAdminUser()
  seedSuperAdminUser()
  seedSampleJobs()
  seedSampleWorkers()
  persistState()
}

const seedDemoUser = () => {
  const exists = state.users.some((user) => user.email === 'demo@rozwork.com')
  if (exists) return

  state.users.push({
    id: 'user_demo',
    name: 'RozWork Demo',
    email: 'demo@rozwork.com',
    password: bcrypt.hashSync('demo123456', 10),
    role: 'worker',
    bio: 'Demo account for RozWork sign-in testing.',
    location: 'Mumbai, India',
    skills: ['Plumbing', 'Cleaning', 'Delivery'],
    phone: '+91 99999 00000',
    username: 'rozworkdemo',
    address: 'Andheri, Mumbai',
    profession: 'General Worker',
    experience: ['2 years of hands-on work'],
    education: ['High school diploma'],
    certificates: ['Safety training'],
    portfolio: [],
    socialLinks: [],
    companyName: '',
    businessDetails: '',
    availability: 'Available now',
    notificationsEnabled: true,
    privacyMode: 'Private profile',
    photo: '',
    ratings: 0,
    completedJobs: 0,
    earnings: 0,
    joinDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
}

const seedAdminUser = () => {
  const exists = state.users.some((user) => user.email === 'admin@rozwork.com')
  if (exists) return

  state.users.push({
    id: 'user_admin',
    name: 'RozWork Admin',
    email: 'admin@rozwork.com',
    password: bcrypt.hashSync('admin123456', 10),
    role: 'admin',
    bio: 'Administrator for RozWork operations.',
    location: 'Delhi, India',
    skills: ['Platform management', 'Support'],
    phone: '+91 88888 11111',
    username: 'rozworkadmin',
    address: 'Connaught Place, Delhi',
    profession: 'Platform Administrator',
    experience: ['Admin support'],
    education: ['Bachelor of Business Administration'],
    certificates: ['Admin onboarding'],
    portfolio: [],
    socialLinks: [],
    companyName: 'RozWork',
    businessDetails: 'Operations control',
    availability: 'Online',
    notificationsEnabled: true,
    privacyMode: 'Private profile',
    photo: '',
    ratings: 0,
    completedJobs: 0,
    earnings: 0,
    joinDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
}

const seedQuickAdminUser = () => {
  const exists = state.users.some((user) => user.username === 'ishvar' || user.email === 'ishvar@rozwork.com')
  if (exists) return

  state.users.push({
    id: 'user_admin_quick',
    name: 'Ishvar',
    email: 'ishvar@rozwork.com',
    password: bcrypt.hashSync('1234567890', 10),
    role: 'admin',
    bio: 'Quick admin access for RozWork.',
    location: 'Ahmedabad, India',
    skills: ['Admin access', 'Support'],
    phone: '+91 77777 22222',
    username: 'ishvar',
    address: 'Ahmedabad',
    profession: 'Admin Manager',
    experience: ['System onboarding'],
    education: ['Bachelor of Commerce'],
    certificates: ['Admin credentials'],
    portfolio: [],
    socialLinks: [],
    companyName: 'RozWork',
    businessDetails: 'Quick admin access',
    availability: 'Online',
    notificationsEnabled: true,
    privacyMode: 'Private profile',
    photo: '',
    ratings: 0,
    completedJobs: 0,
    earnings: 0,
    joinDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
}

const seedSuperAdminUser = () => {
  const exists = state.users.some((user) => user.phone === '9660585691' || user.email === 'superadmin@rozwork.com')
  if (exists) return

  state.users.push({
    id: 'user_super_admin',
    name: 'Super Admin',
    email: 'superadmin@rozwork.com',
    password: bcrypt.hashSync('123456789', 10),
    role: 'super_admin',
    bio: 'Super administrator for the RozWork control center.',
    location: 'Mumbai, India',
    skills: ['Platform governance', 'Moderation'],
    phone: '9660585691',
    username: 'superadmin',
    address: 'Mumbai',
    profession: 'Super Administrator',
    experience: ['Platform setup'],
    education: ['MBA'],
    certificates: ['Security and governance'],
    portfolio: [],
    socialLinks: [],
    companyName: 'RozWork',
    businessDetails: 'Super admin access',
    availability: 'Online',
    notificationsEnabled: true,
    privacyMode: 'Private profile',
    photo: '',
    ratings: 0,
    completedJobs: 0,
    earnings: 0,
    joinDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
}

const seedSampleJobs = () => {
  const sampleJobs = [
    {
      title: 'Farm Labour Support for Harvesting',
      category: 'Farm Labour',
      location: 'Nashik, India',
      salary: '₹400/day',
      description: 'Help with harvesting, field clearing, and crop handling for a local farm.',
      goalTags: ['flexible-hours'],
    },
    {
      title: 'Skilled Plumbing Repair',
      category: 'Skilled Trades',
      location: 'Delhi, India',
      salary: '₹900/day',
      description: 'Install and repair water lines and plumbing fixtures in a residential building.',
      goalTags: ['skill-growth', 'quick-income'],
    },
    {
      title: 'Local Delivery Driver',
      category: 'Drivers',
      location: 'Pune, India',
      salary: '₹700/day',
      description: 'Drive local routes and deliver parcels for a busy logistics partner.',
      goalTags: ['quick-income', 'flexible-hours'],
    },
    {
      title: 'House Cleaning and Home Helper',
      category: 'House Helpers',
      location: 'Mumbai, India',
      salary: '₹500/day',
      description: 'Support daily house cleaning, laundry, and kitchen maintenance for a family.',
      goalTags: ['quick-income', 'flexible-hours'],
    },
    {
      title: 'Student Internship for Digital Support',
      category: 'Students',
      location: 'Bangalore, India',
      salary: '₹300/day',
      description: 'Assist with admin support, social media updates, and document handling.',
      goalTags: ['flexible-hours', 'skill-growth'],
    },
    {
      title: 'Warehouse Packing Assistant',
      category: 'House Helpers',
      location: 'Ahmedabad, India',
      salary: '₹450/day',
      description: 'Pack goods, load boxes, and support day-to-day warehouse operations.',
      goalTags: ['quick-income'],
    },
    {
      title: 'Electrical Wiring for Small Office',
      category: 'Skilled Trades',
      location: 'Jaipur, India',
      salary: '₹950/day',
      description: 'Wire a small office and fix damaged sockets and switches.',
      goalTags: ['skill-growth', 'quick-income'],
    },
    {
      title: 'Night Shift Cab Driver',
      category: 'Drivers',
      location: 'Chennai, India',
      salary: '₹800/day',
      description: 'Drive customers safely during evening and night shifts.',
      goalTags: ['quick-income'],
    },
    {
      title: 'Garden and Farm Maintenance',
      category: 'Farm Labour',
      location: 'Mysuru, India',
      salary: '₹380/day',
      description: 'Help with watering, soil prep, and general farm upkeep.',
      goalTags: ['flexible-hours'],
    },
    {
      title: 'Research Assistant Internship',
      category: 'Students',
      location: 'Hyderabad, India',
      salary: '₹350/day',
      description: 'Support data entry, research notes, and reporting tasks for a startup.',
      goalTags: ['skill-growth', 'flexible-hours'],
    },
  ]

  sampleJobs.forEach((job) => {
    const exists = state.jobs.some((existingJob) => existingJob.title === job.title)
    if (exists) return

    state.jobs.push({
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...job,
      createdAt: new Date().toISOString(),
    })
  })
}

const seedSampleWorkers = () => {
  const workerProfiles = [
    {
      name: 'Asha Patel',
      email: 'asha.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Experienced cleaner and home helper with flexible availability.',
      location: 'Mumbai, India',
      skills: ['Cleaning', 'Home Help', 'Packing'],
      phone: '+91 90000 00001',
      username: 'ashapatel',
      profession: 'Home Helper',
      experience: ['3 years of household support'],
      education: ['High school diploma'],
      certificates: ['Safety training'],
      ratings: 4.9,
    },
    {
      name: 'Ravi Kumar',
      email: 'ravi.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Reliable driver with local delivery experience.',
      location: 'Pune, India',
      skills: ['Driving', 'Delivery', 'Route Planning'],
      phone: '+91 90000 00002',
      username: 'ravikumar',
      profession: 'Driver',
      experience: ['5 years in local transport'],
      education: ['Secondary education'],
      certificates: ['Driver license'],
      ratings: 4.8,
    },
    {
      name: 'Mukesh Sharma',
      email: 'mukesh.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Skilled plumber for homes and small commercial sites.',
      location: 'Delhi, India',
      skills: ['Plumbing', 'Repairs', 'Maintenance'],
      phone: '+91 90000 00003',
      username: 'mukeshsharma',
      profession: 'Plumber',
      experience: ['7 years in plumbing'],
      education: ['Technical diploma'],
      certificates: ['Plumbing certification'],
      ratings: 4.9,
    },
    {
      name: 'Neha Verma',
      email: 'neha.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Customer-friendly beautician and salon support specialist.',
      location: 'Jaipur, India',
      skills: ['Beauty', 'Salon Support', 'Client Care'],
      phone: '+91 90000 00004',
      username: 'nehaverma',
      profession: 'Beautician',
      experience: ['4 years in salon services'],
      education: ['Beauty training'],
      certificates: ['Cosmetology certificate'],
      ratings: 4.7,
    },
    {
      name: 'Suresh Bhatia',
      email: 'suresh.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Hands-on electrician for homes and small businesses.',
      location: 'Ahmedabad, India',
      skills: ['Electrical Work', 'Wiring', 'Repairs'],
      phone: '+91 90000 00005',
      username: 'sureshbhatia',
      profession: 'Electrician',
      experience: ['6 years of electrical work'],
      education: ['Industrial training'],
      certificates: ['Electrical safety'],
      ratings: 4.8,
    },
    {
      name: 'Kiran Rao',
      email: 'kiran.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Dependable farm labourer for field support and harvesting.',
      location: 'Nashik, India',
      skills: ['Farm Labour', 'Harvesting', 'Field Support'],
      phone: '+91 90000 00006',
      username: 'kiranrao',
      profession: 'Farm Labour',
      experience: ['5 years in agricultural support'],
      education: ['Schooling'],
      certificates: ['Field safety'],
      ratings: 4.9,
    },
    {
      name: 'Priya Nair',
      email: 'priya.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Organized assistant for childcare and household support.',
      location: 'Bangalore, India',
      skills: ['Childcare', 'Housekeeping', 'Support'],
      phone: '+91 90000 00007',
      username: 'priyanair',
      profession: 'Care Assistant',
      experience: ['3 years in home care'],
      education: ['Diploma in childcare'],
      certificates: ['First aid'],
      ratings: 4.8,
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Masonry and construction helper with strong site discipline.',
      location: 'Chennai, India',
      skills: ['Construction', 'Masonry', 'Site Support'],
      phone: '+91 90000 00008',
      username: 'arjunmehta',
      profession: 'Construction Helper',
      experience: ['4 years on-site work'],
      education: ['Vocational training'],
      certificates: ['Site safety'],
      ratings: 4.7,
    },
    {
      name: 'Lata Deshmukh',
      email: 'lata.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Professional cook and food prep support for events and homes.',
      location: 'Nagpur, India',
      skills: ['Cooking', 'Food Prep', 'Event Support'],
      phone: '+91 90000 00009',
      username: 'latadeshmukh',
      profession: 'Cook',
      experience: ['6 years in food service'],
      education: ['Culinary training'],
      certificates: ['Food hygiene'],
      ratings: 4.9,
    },
    {
      name: 'Deepak Joshi',
      email: 'deepak.worker@rozwork.com',
      password: 'worker123',
      role: 'worker',
      bio: 'Reliable handyman for repairs, furniture assembly, and maintenance.',
      location: 'Surat, India',
      skills: ['Handyman', 'Furniture Assembly', 'Repairs'],
      phone: '+91 90000 00010',
      username: 'deepakjoshi',
      profession: 'Handyman',
      experience: ['8 years in maintenance'],
      education: ['Technical certificate'],
      certificates: ['Maintenance certification'],
      ratings: 4.8,
    },
  ]

  workerProfiles.forEach((profile) => {
    const exists = state.users.some((user) => user.email === profile.email)
    if (exists) return

    state.users.push({
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: profile.name,
      email: profile.email,
      password: bcrypt.hashSync(profile.password, 10),
      role: profile.role,
      bio: profile.bio,
      location: profile.location,
      skills: profile.skills,
      phone: profile.phone,
      username: profile.username,
      address: profile.location,
      profession: profile.profession,
      experience: profile.experience,
      education: profile.education,
      certificates: profile.certificates,
      portfolio: [],
      socialLinks: [],
      companyName: '',
      businessDetails: '',
      availability: 'Available now',
      notificationsEnabled: true,
      privacyMode: 'Private profile',
      photo: '',
      ratings: profile.ratings,
      completedJobs: 0,
      earnings: 0,
      purchases: [],
      joinDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  })
}

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
  seedDemoUser()
  seedAdminUser()
  seedQuickAdminUser()
  seedSuperAdminUser()
  seedSampleJobs()
  seedSampleWorkers()
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
