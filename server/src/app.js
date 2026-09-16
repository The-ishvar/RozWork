import express from 'express'
import cors from 'cors'
import './config/env.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import purchaseRoutes from './routes/purchaseRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import walletRoutes from './routes/walletRoutes.js'
import productRoutes from './routes/productRoutes.js'
import reelRoutes from './routes/reelRoutes.js'
import withdrawalRoutes from './routes/withdrawalRoutes.js'
import advertisementRoutes from './routes/advertisementRoutes.js'
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import walletAdminRoutes from './routes/walletAdminRoutes.js'
import notificationAdminRoutes from './routes/notificationAdminRoutes.js'
import revenueRoutes from './routes/revenueRoutes.js'
import auditRoutes from './routes/auditRoutes.js'
import coinRoutes from './routes/coinRoutes.js'
import User from './models/User.js'
import Job from './models/Job.js'
import { addPlatformListener } from './utils/events.js'

export const app = express()

const allowedOrigins = [
  'https://roz-work.vercel.app',
  'https://www.roz-work.vercel.app',
  'https://roz-work-git-main-isvar-s-projects.vercel.app',
  'https://roz-1-xemo.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

app.use((req, _res, next) => {
  console.info('[api-request]', {
    method: req.method,
    path: req.originalUrl,
    origin: req.get('origin') || undefined,
  })
  next()
})

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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  res.write(': connected\n\n')

  const listener = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  const unsubscribe = addPlatformListener(listener)
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n')
  }, 15000)

  req.on('close', () => {
    clearInterval(keepAlive)
    unsubscribe()
  })
})

app.get('/api/search/categories', async (_req, res) => {
  try {
    const categories = await Job.distinct('category')
    res.json({ categories: categories.filter(Boolean) })
  } catch {
    res.json({ categories: [] })
  }
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
  try {
    const workers = await User.find({ role: { $in: ['worker', 'user'] } }).sort({ createdAt: -1 }).limit(24).lean()
    res.json({ workers: workers.map((worker) => ({
      id: worker._id.toString(),
      name: worker.name,
      profession: worker.profession || '',
      bio: worker.bio || '',
      location: worker.location || '',
      skills: worker.skills || [],
      category: worker.serviceCategories?.[0] || worker.profession || '',
      photo: worker.photo || '',
      ratings: worker.ratings || 0,
      price: worker.earnings || 0,
      availability: worker.availability || '',
      completedJobs: worker.completedJobs || 0,
      isPremium: !!worker.isPremium,
      goalTags: worker.goalTags || [],
    })) })
  } catch {
    res.json({ workers: [] })
  }
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
app.use('/chat', chatRoutes)
app.use('/api/chat', chatRoutes)
app.use('/payments', paymentRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/wallet', walletRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/products', productRoutes)
app.use('/api/products', productRoutes)
app.use('/reels', reelRoutes)
app.use('/api/reels', reelRoutes)
app.use('/withdrawals', withdrawalRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
app.use('/advertisements', advertisementRoutes)
app.use('/api/advertisements', advertisementRoutes)
app.use('/subscription-plans', subscriptionPlanRoutes)
app.use('/api/subscription-plans', subscriptionPlanRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/reports', reportRoutes)
app.use('/api/reports', reportRoutes)
app.use('/admin/wallet', walletAdminRoutes)
app.use('/api/admin/wallet', walletAdminRoutes)
app.use('/admin/notifications', notificationAdminRoutes)
app.use('/api/admin/notifications', notificationAdminRoutes)
app.use('/admin/revenue', revenueRoutes)
app.use('/api/admin/revenue', revenueRoutes)
app.use('/admin/audit', auditRoutes)
app.use('/api/admin/audit', auditRoutes)
app.use('/coins', coinRoutes)
app.use('/api/coins', coinRoutes)

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
