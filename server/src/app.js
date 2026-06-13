import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import purchaseRoutes from './routes/purchaseRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import User from './models/User.js'
import Job from './models/Job.js'
import Service from './models/Service.js'
import Notification from './models/Notification.js'
import { connectToDatabase, ensureDatabaseConnection } from './db/connect.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

export const app = express()

const allowedOrigins = [
  'https://roz-work-git-main-isvar-s-projects.vercel.app',
  'https://roz-1-xemo.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /vercel\.app$/i.test(origin) || /localhost/i.test(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' })
})

app.get('/api/search/categories', async (_req, res) => {
  res.json({ categories: ['Farm Labour', 'Skilled Trades', 'Drivers', 'House Helpers', 'Students'] })
})

app.get('/api/search', async (req, res) => {
  const query = String(req.query.q || '').trim()
  const jobs = await Job.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  }).sort({ createdAt: -1 }).limit(10).lean()

  res.json({ q: query, jobs })
})

app.get('/api/workers', async (_req, res) => {
  const workers = await User.find({ role: { $in: ['worker', 'user'] } }).sort({ createdAt: -1 }).limit(12).lean()
  res.json({ workers: workers.map((worker) => ({
    id: worker._id.toString(),
    name: worker.name,
    profession: worker.profession || 'Professional',
    bio: worker.bio || 'Skilled professional ready to help.',
    location: worker.location || 'Mumbai, India',
    skills: worker.skills || [],
    ratings: worker.ratings || 4.8,
    price: worker.earnings || 500,
    availability: worker.availability || 'Available now',
    goalTags: ['quick-income', 'flexible-hours'],
  })) })
})

app.use('/auth', authRoutes)
app.use('/api/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/api/users', userRoutes)
app.use('/jobs', jobRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/applications', jobRoutes)
app.use('/api/applications', jobRoutes)
app.use('/purchases', purchaseRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/bookings', bookingRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/notifications', notificationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/admin', adminRoutes)
app.use('/api/admin', adminRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/api/dashboard', dashboardRoutes)

let seedPromise = null

export const seedDefaultData = async () => {
  if (seedPromise) {
    return seedPromise
  }

  seedPromise = (async () => {
    const connected = await ensureDatabaseConnection()
    if (!connected) {
      return
    }
    const adminEmail = 'admin@rozwork.com'
    const superAdminEmail = 'superadmin@rozwork.com'

    const [existingJobs, existingServices, existingNotifications] = await Promise.all([
      Job.countDocuments(),
      Service.countDocuments(),
      Notification.countDocuments(),
    ])

    const upsertUser = async (filter, values) => {
      const existing = await User.findOne(filter)
      if (existing) {
        Object.assign(existing, values)
        if (typeof values.password === 'string' && values.password.length > 0) {
          existing.password = values.password
        }
        await existing.save()
        return existing
      }

      return User.create(values)
    }

    await Promise.all([
      upsertUser(
        { email: adminEmail },
        {
          name: 'RozWork Admin',
          email: adminEmail,
          password: 'admin123456',
          role: 'admin',
          username: 'rozworkadmin',
          phone: '9660585691',
          profession: 'Platform Administrator',
          bio: 'Administrator for RozWork operations.',
        },
      ),
      upsertUser(
        { email: 'ishvar@rozwork.com' },
        {
          name: 'Ishvar',
          email: 'ishvar@rozwork.com',
          password: '1234567890',
          role: 'admin',
          username: 'ishvar',
          phone: '9660585691',
          profession: 'Admin Manager',
          bio: 'Admin account for RozWork operations.',
        },
      ),
      upsertUser(
        { email: superAdminEmail },
        {
          name: 'Super Admin',
          email: superAdminEmail,
          password: '123456789',
          role: 'super_admin',
          username: 'superadmin',
          phone: '9660585691',
          profession: 'Super Administrator',
          bio: 'Super administrator for the RozWork control center.',
        },
      ),
      upsertUser(
        { email: 'demo@rozwork.com' },
        {
          name: 'Demo User',
          email: 'demo@rozwork.com',
          password: 'demo123456',
          role: 'worker',
          username: 'demo',
          profession: 'Home Helper',
          bio: 'Seeded demo account for product tours.',
        },
      ),
    ])

    const existingWorkerCount = await User.countDocuments({ role: 'worker' })
    if (existingWorkerCount < 10) {
      const workerProfiles = [
        { name: 'Asha Patel', email: 'asha@rozwork.com', password: 'worker123', role: 'worker', username: 'asha', profession: 'Home Helper', bio: 'Trusted home helper with 6 years of experience.', location: 'Mumbai', skills: ['cleaning', 'cooking', 'childcare'], ratings: 4.9, earnings: 700 },
        { name: 'Ravi Kumar', email: 'ravi@rozwork.com', password: 'worker123', role: 'worker', username: 'ravi', profession: 'Driver', bio: 'Reliable driver for local deliveries and airport pickups.', location: 'Delhi', skills: ['driving', 'navigation'], ratings: 4.8, earnings: 900 },
        { name: 'Meera Nair', email: 'meera@rozwork.com', password: 'worker123', role: 'worker', username: 'meera', profession: 'Cleaner', bio: 'Detail-oriented cleaner for homes and offices.', location: 'Bengaluru', skills: ['cleaning', 'sanitization'], ratings: 4.7, earnings: 650 },
        { name: 'Jonas Dsouza', email: 'jonas@rozwork.com', password: 'worker123', role: 'worker', username: 'jonas', profession: 'Electrician', bio: 'Skilled electrician for quick repairs and installations.', location: 'Pune', skills: ['electrical', 'wiring'], ratings: 4.9, earnings: 1100 },
        { name: 'Neha Sharma', email: 'neha@rozwork.com', password: 'worker123', role: 'worker', username: 'neha', profession: 'Plumber', bio: 'Fast plumbing repairs with transparent pricing.', location: 'Hyderabad', skills: ['plumbing', 'repair'], ratings: 4.8, earnings: 1000 },
        { name: 'Suresh Bhatia', email: 'suresh@rozwork.com', password: 'worker123', role: 'worker', username: 'suresh', profession: 'Garden Helper', bio: 'Seasonal and regular gardening support.', location: 'Chandigarh', skills: ['gardening', 'watering'], ratings: 4.6, earnings: 600 },
        { name: 'Kavita Rao', email: 'kavita@rozwork.com', password: 'worker123', role: 'worker', username: 'kavita', profession: 'Caretaker', bio: 'Dependable caretaker and household support.', location: 'Mumbai', skills: ['care', 'housekeeping'], ratings: 4.8, earnings: 750 },
        { name: 'Arun Verma', email: 'arun@rozwork.com', password: 'worker123', role: 'worker', username: 'arun', profession: 'Painter', bio: 'Interior and exterior painting support.', location: 'Jaipur', skills: ['painting', 'finishing'], ratings: 4.7, earnings: 800 },
        { name: 'Pooja Singh', email: 'pooja@rozwork.com', password: 'worker123', role: 'worker', username: 'pooja', profession: 'Tutor', bio: 'Flexible tutor for school subjects and exam prep.', location: 'Lucknow', skills: ['teaching', 'mentoring'], ratings: 4.9, earnings: 550 },
        { name: 'Dinesh Shah', email: 'dinesh@rozwork.com', password: 'worker123', role: 'worker', username: 'dinesh', profession: 'Handyman', bio: 'Multi-skill handyman for minor fixes and installations.', location: 'Ahmedabad', skills: ['repair', 'assembly'], ratings: 4.8, earnings: 850 },
      ]

      await Promise.all(workerProfiles.map((profile) => upsertUser({ email: profile.email }, profile)))
    }

    if (existingJobs === 0) {
      const seedJobs = [
        { title: 'Weekend Garden Support', category: 'Farm Labour', location: 'Lahore', salary: '₹800/day', description: 'Help with watering, harvesting, and basic garden maintenance.', goalTags: ['quick-income', 'flexible-hours'] },
        { title: 'Skilled Plumbing Repair', category: 'Skilled Trades', location: 'Delhi', salary: '₹1200/day', description: 'Fast repair and maintenance work for homes and offices.', goalTags: ['skill-growth'] },
        { title: 'Driver for Local Deliveries', category: 'Drivers', location: 'Mumbai', salary: '₹900/day', description: 'Reliable driver for local deliveries and pickups.', goalTags: ['quick-income'] },
        { title: 'House Helper Support', category: 'House Helpers', location: 'Bangalore', salary: '₹700/day', description: 'Cleaning, cooking, and general support assistance.', goalTags: ['flexible-hours'] },
        { title: 'Student Research Assistant', category: 'Students', location: 'Pune', salary: '₹500/day', description: 'Flexible support for research and admin tasks.', goalTags: ['skill-growth', 'flexible-hours'] },
      ]

      await Job.insertMany(seedJobs.map((job) => ({ ...job, postedByRole: 'employer', status: 'approved' })))
    }

    if (existingServices === 0) {
      await Service.create({ title: 'Home Cleaning', description: 'Reliable cleaning support', category: 'House Helpers', price: 500, providerName: 'Asha Patel', location: 'Mumbai', status: 'active', tags: ['cleaning', 'home'] })
    }

    if (existingNotifications === 0) {
      const admin = await User.findOne({ email: adminEmail })
      if (admin) {
        await Notification.create({ userId: admin._id, type: 'system', title: 'Welcome', message: 'RozWork is live and ready for bookings.' })
      }
    }
  })()

  try {
    return await seedPromise
  } finally {
    seedPromise = null
  }
}

export const resetState = async () => {
  const connected = await ensureDatabaseConnection()
  if (!connected) {
    return
  }

  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Service.deleteMany({}),
    Notification.deleteMany({}),
  ])
  await seedDefaultData()
}

connectToDatabase().then(() => seedDefaultData()).catch((error) => {
  console.error('Database connection failed', error)
})

app.use((err, _req, res, _next) => {
  console.error('Unhandled API error:', err)
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal server error'
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED')

  res.status(statusCode).json({
    success: false,
    message,
    code,
  })
})

export default app