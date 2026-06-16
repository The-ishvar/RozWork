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
import galleryRoutes from './routes/galleryRoutes.js'
import User from './models/User.js'
import Job from './models/Job.js'
import Service from './models/Service.js'
import Notification from './models/Notification.js'
import GalleryItem from './models/GalleryItem.js'
import LoginHistory from './models/LoginHistory.js'
import UserActivity from './models/UserActivity.js'
import Booking from './models/Booking.js'
import Purchase from './models/Purchase.js'
import Transaction from './models/Transaction.js'
import Payment from './models/Payment.js'
import { connectToDatabase, ensureDatabaseConnection } from './db/connect.js'
import { addPlatformListener } from './utils/events.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

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
  const workers = await User.find({ role: { $in: ['worker', 'user'] } }).sort({ createdAt: -1 }).limit(24).lean()
  res.json({ workers: workers.map((worker) => ({
    id: worker._id.toString(),
    name: worker.name,
    profession: worker.profession || 'Professional',
    bio: worker.bio || 'Skilled professional ready to help.',
    location: worker.location || 'Mumbai, India',
    skills: worker.skills || [],
    category: worker.serviceCategories?.[0] || worker.profession || 'General',
    photo: worker.photo || '',
    ratings: worker.ratings || 4.8,
    price: worker.earnings || 500,
    availability: worker.availability || 'Available now',
    completedJobs: worker.completedJobs || 0,
    isPremium: !!worker.isPremium,
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
app.use('/gallery', galleryRoutes)
app.use('/api/gallery', galleryRoutes)

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

    const [existingServices, existingNotifications, existingJobs, existingGalleryItems] = await Promise.all([
      Service.countDocuments(),
      Notification.countDocuments(),
      Job.countDocuments(),
      GalleryItem.countDocuments(),
    ])

    const categorySeedData = [
      { name: 'Driver', workers: [
        { name: 'Aarav Kumar', email: 'driver-1@rozwork.com', location: 'Mumbai', profession: 'Driver', skills: ['Local delivery', 'Airport pickup'], experience: ['5 years driving experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
        { name: 'Nitin Rao', email: 'driver-2@rozwork.com', location: 'Pune', profession: 'Driver', skills: ['Goods transportation', 'Route planning'], experience: ['4 years driving experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
        { name: 'Irfan Shaikh', email: 'driver-3@rozwork.com', location: 'Delhi', profession: 'Driver', skills: ['Truck driving', 'Safe loading'], experience: ['6 years driving experience'], availability: 'Busy today', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
        { name: 'Rajat Singh', email: 'driver-4@rozwork.com', location: 'Bengaluru', profession: 'Driver', skills: ['Bike courier', 'Metro routes'], experience: ['3 years driving experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
        { name: 'Vikram Das', email: 'driver-5@rozwork.com', location: 'Hyderabad', profession: 'Driver', skills: ['Passenger transport', 'Night shift'], experience: ['7 years driving experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Electrician', workers: [
        { name: 'Suresh Mehta', email: 'electrician-1@rozwork.com', location: 'Mumbai', profession: 'Electrician', skills: ['Wiring', 'Fan fitting'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Pavan Joshi', email: 'electrician-2@rozwork.com', location: 'Delhi', profession: 'Electrician', skills: ['Switchboard repair', 'Inverter installation'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Mohan Shah', email: 'electrician-3@rozwork.com', location: 'Ahmedabad', profession: 'Electrician', skills: ['Appliance repair', 'Safety checks'], experience: ['4 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Kishore Verma', email: 'electrician-4@rozwork.com', location: 'Chennai', profession: 'Electrician', skills: ['Commercial wiring', 'Lighting design'], experience: ['9 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Anand Bhat', email: 'electrician-5@rozwork.com', location: 'Bengaluru', profession: 'Electrician', skills: ['Panel boards', 'Circuit testing'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Plumber', workers: [
        { name: 'Bharat Solanki', email: 'plumber-1@rozwork.com', location: 'Mumbai', profession: 'Plumber', skills: ['Pipe fitting', 'Tap repair'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ramesh Pawar', email: 'plumber-2@rozwork.com', location: 'Pune', profession: 'Plumber', skills: ['Water tank installation', 'Drain cleaning'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Jitendra Yadav', email: 'plumber-3@rozwork.com', location: 'Delhi', profession: 'Plumber', skills: ['Bathroom fittings', 'Leak detection'], experience: ['8 years experience'], availability: 'Busy today', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sanjay Pillai', email: 'plumber-4@rozwork.com', location: 'Kolkata', profession: 'Plumber', skills: ['Pipeline maintenance', 'Water heater fit'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Abdul Khan', email: 'plumber-5@rozwork.com', location: 'Hyderabad', profession: 'Plumber', skills: ['Bathroom renovation', 'PVC joints'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Carpenter', workers: [
        { name: 'Ravi Patil', email: 'carpenter-1@rozwork.com', location: 'Mumbai', profession: 'Carpenter', skills: ['Furniture repair', 'Wardrobe fitting'], experience: ['10 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ganesh Rao', email: 'carpenter-2@rozwork.com', location: 'Pune', profession: 'Carpenter', skills: ['Door installation', 'Custom shelves'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Mahesh Kumar', email: 'carpenter-3@rozwork.com', location: 'Bengaluru', profession: 'Carpenter', skills: ['Kitchen carpentry', 'Wood polishing'], experience: ['6 years experience'], availability: 'Busy tomorrow', photo: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Dinesh Sharma', email: 'carpenter-4@rozwork.com', location: 'Delhi', profession: 'Carpenter', skills: ['Window fixing', 'Interior work'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Harish Malik', email: 'carpenter-5@rozwork.com', location: 'Hyderabad', profession: 'Carpenter', skills: ['Wooden flooring', 'Furniture customization'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Painter', workers: [
        { name: 'Nilesh Dube', email: 'painter-1@rozwork.com', location: 'Mumbai', profession: 'Painter', skills: ['Interior painting', 'Wall prep'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Amit Jadhav', email: 'painter-2@rozwork.com', location: 'Pune', profession: 'Painter', skills: ['Exterior painting', 'Texture finish'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Saeed Ali', email: 'painter-3@rozwork.com', location: 'Delhi', profession: 'Painter', skills: ['Home repainting', 'Ceiling work'], experience: ['5 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Prakash Nair', email: 'painter-4@rozwork.com', location: 'Chennai', profession: 'Painter', skills: ['Waterproof coating', 'Decorative painting'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Kunal Sethi', email: 'painter-5@rozwork.com', location: 'Ahmedabad', profession: 'Painter', skills: ['Apartment touch-ups', 'Color matching'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Farmer', workers: [
        { name: 'Bhagwan Rao', email: 'farmer-1@rozwork.com', location: 'Nashik', profession: 'Farmer', skills: ['Crop handling', 'Harvest support'], experience: ['12 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sanjay Borse', email: 'farmer-2@rozwork.com', location: 'Nagpur', profession: 'Farmer', skills: ['Irrigation support', 'Soil prep'], experience: ['9 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' },
        { name: 'Vijay Kuma', email: 'farmer-3@rozwork.com', location: 'Mysuru', profession: 'Farmer', skills: ['Pesticide handling', 'Farm labour'], experience: ['10 years experience'], availability: 'Busy tomorrow', photo: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' },
        { name: 'Arun Patel', email: 'farmer-4@rozwork.com', location: 'Surat', profession: 'Farmer', skills: ['Harvesting', 'Nursery work'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' },
        { name: 'Rakesh Yadav', email: 'farmer-5@rozwork.com', location: 'Jaipur', profession: 'Farmer', skills: ['Field support', 'Equipment handling'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Labour', workers: [
        { name: 'Raju K', email: 'labour-1@rozwork.com', location: 'Mumbai', profession: 'Labour', skills: ['Loading', 'Site cleanup'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Manoj Tiwari', email: 'labour-2@rozwork.com', location: 'Delhi', profession: 'Labour', skills: ['Material handling', 'Assembly'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Siva Reddy', email: 'labour-3@rozwork.com', location: 'Hyderabad', profession: 'Labour', skills: ['Packaging', 'Warehouse support'], experience: ['6 years experience'], availability: 'Busy today', photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Deepak Singh', email: 'labour-4@rozwork.com', location: 'Bengaluru', profession: 'Labour', skills: ['Construction support', 'Tool handling'], experience: ['3 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
        { name: 'Akash Patil', email: 'labour-5@rozwork.com', location: 'Pune', profession: 'Labour', skills: ['Site shifting', 'Heavy lifting'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'House Helper', workers: [
        { name: 'Asha Sharma', email: 'househelper-1@rozwork.com', location: 'Mumbai', profession: 'House Helper', skills: ['Cleaning', 'Cooking'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=800&q=80' },
        { name: 'Lata Nair', email: 'househelper-2@rozwork.com', location: 'Bengaluru', profession: 'House Helper', skills: ['Laundry', 'Child care'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=800&q=80' },
        { name: 'Meena Joshi', email: 'househelper-3@rozwork.com', location: 'Delhi', profession: 'House Helper', skills: ['Kitchen help', 'Home organization'], experience: ['5 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=800&q=80' },
        { name: 'Geeta Singh', email: 'househelper-4@rozwork.com', location: 'Chennai', profession: 'House Helper', skills: ['Deep cleaning', 'Pet care'], experience: ['3 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sunita Reddy', email: 'househelper-5@rozwork.com', location: 'Pune', profession: 'House Helper', skills: ['Cooking', 'Meal prep'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Cleaner', workers: [
        { name: 'Sangita Das', email: 'cleaner-1@rozwork.com', location: 'Mumbai', profession: 'Cleaner', skills: ['Office cleaning', 'Sanitization'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
        { name: 'Pooja Verma', email: 'cleaner-2@rozwork.com', location: 'Delhi', profession: 'Cleaner', skills: ['Home cleaning', 'Carpet care'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
        { name: 'Kavita Iyer', email: 'cleaner-3@rozwork.com', location: 'Bengaluru', profession: 'Cleaner', skills: ['Deep cleaning', 'Disinfection'], experience: ['6 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ritu Bhatia', email: 'cleaner-4@rozwork.com', location: 'Pune', profession: 'Cleaner', skills: ['Commercial spaces', 'Floor polishing'], experience: ['3 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
        { name: 'Nisha Shah', email: 'cleaner-5@rozwork.com', location: 'Hyderabad', profession: 'Cleaner', skills: ['Kitchen sanitation', 'Window cleaning'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Mechanic', workers: [
        { name: 'Sanjay Gupta', email: 'mechanic-1@rozwork.com', location: 'Mumbai', profession: 'Mechanic', skills: ['Bike repair', 'Engine tuning'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581091215367-0b6c99e4fcb4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Salim Khan', email: 'mechanic-2@rozwork.com', location: 'Delhi', profession: 'Mechanic', skills: ['Car servicing', 'Brake repair'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581091215367-0b6c99e4fcb4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Rahul Nair', email: 'mechanic-3@rozwork.com', location: 'Bengaluru', profession: 'Mechanic', skills: ['Electrical diagnostics', 'Oil change'], experience: ['6 years experience'], availability: 'Busy today', photo: 'https://images.unsplash.com/photo-1581091215367-0b6c99e4fcb4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sandeep Roy', email: 'mechanic-4@rozwork.com', location: 'Pune', profession: 'Mechanic', skills: ['Vehicle inspection', 'Battery replacement'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581091215367-0b6c99e4fcb4?auto=format&fit=crop&w=800&q=80' },
        { name: 'Praveen Shetty', email: 'mechanic-5@rozwork.com', location: 'Ahmedabad', profession: 'Mechanic', skills: ['Transmission work', 'Fuel system'], experience: ['9 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1581091215367-0b6c99e4fcb4?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'AC Repair', workers: [
        { name: 'Firoz Malik', email: 'acrepair-1@rozwork.com', location: 'Mumbai', profession: 'AC Repair', skills: ['Cooling system servicing', 'Gas refill'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ankit Bansal', email: 'acrepair-2@rozwork.com', location: 'Delhi', profession: 'AC Repair', skills: ['Split AC repair', 'Filter cleaning'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
        { name: 'Javed Akhtar', email: 'acrepair-3@rozwork.com', location: 'Bengaluru', profession: 'AC Repair', skills: ['Central AC service', 'Leak testing'], experience: ['7 years experience'], availability: 'Busy tomorrow', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
        { name: 'Naveen Gopal', email: 'acrepair-4@rozwork.com', location: 'Chennai', profession: 'AC Repair', skills: ['Compressor replacement', 'Circuit testing'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
        { name: 'Shivam Rao', email: 'acrepair-5@rozwork.com', location: 'Pune', profession: 'AC Repair', skills: ['AC installation', 'Maintenance plans'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Mobile Repair', workers: [
        { name: 'Harshal Das', email: 'mobile-1@rozwork.com', location: 'Mumbai', profession: 'Mobile Repair', skills: ['Screen replacement', 'Battery repair'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
        { name: 'Raghav Menon', email: 'mobile-2@rozwork.com', location: 'Delhi', profession: 'Mobile Repair', skills: ['Chip-level repair', 'Software issues'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
        { name: 'Karan Joshi', email: 'mobile-3@rozwork.com', location: 'Bengaluru', profession: 'Mobile Repair', skills: ['Water damage repair', 'Camera fixes'], experience: ['4 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
        { name: 'Rishabh Suri', email: 'mobile-4@rozwork.com', location: 'Pune', profession: 'Mobile Repair', skills: ['iPhone repair', 'On-site support'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
        { name: 'Vikash Bhat', email: 'mobile-5@rozwork.com', location: 'Hyderabad', profession: 'Mobile Repair', skills: ['Charging port repair', 'Data recovery'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Computer Repair', workers: [
        { name: 'Gaurav Malik', email: 'computer-1@rozwork.com', location: 'Mumbai', profession: 'Computer Repair', skills: ['Laptop repair', 'OS installation'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Nikhil Shah', email: 'computer-2@rozwork.com', location: 'Delhi', profession: 'Computer Repair', skills: ['Hardware upgrades', 'Virus removal'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ashok Rao', email: 'computer-3@rozwork.com', location: 'Bengaluru', profession: 'Computer Repair', skills: ['Networking', 'Printer setup'], experience: ['5 years experience'], availability: 'Busy today', photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Madhav Nair', email: 'computer-4@rozwork.com', location: 'Pune', profession: 'Computer Repair', skills: ['Data backup', 'Server support'], experience: ['8 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80' },
        { name: 'Nitin Verma', email: 'computer-5@rozwork.com', location: 'Hyderabad', profession: 'Computer Repair', skills: ['Peripheral repair', 'Custom builds'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Tutor', workers: [
        { name: 'Riya Sharma', email: 'tutor-1@rozwork.com', location: 'Mumbai', profession: 'Tutor', skills: ['Math tutoring', 'English coaching'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
        { name: 'Megha Rao', email: 'tutor-2@rozwork.com', location: 'Delhi', profession: 'Tutor', skills: ['Science tuition', 'Exam prep'], experience: ['6 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
        { name: 'Aditi Menon', email: 'tutor-3@rozwork.com', location: 'Bengaluru', profession: 'Tutor', skills: ['Coding classes', 'Online teaching'], experience: ['4 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
        { name: 'Pallavi Nair', email: 'tutor-4@rozwork.com', location: 'Pune', profession: 'Tutor', skills: ['Language coaching', 'Communication skills'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sneha Joshi', email: 'tutor-5@rozwork.com', location: 'Hyderabad', profession: 'Tutor', skills: ['Homework support', 'Senior classes'], experience: ['3 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80' },
      ] },
      { name: 'Freelancer', workers: [
        { name: 'Rohit Dey', email: 'freelancer-1@rozwork.com', location: 'Mumbai', profession: 'Freelancer', skills: ['Design', 'Content writing'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sohan Bhat', email: 'freelancer-2@rozwork.com', location: 'Delhi', profession: 'Freelancer', skills: ['Digital marketing', 'Social media'], experience: ['5 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ananya Rao', email: 'freelancer-3@rozwork.com', location: 'Bengaluru', profession: 'Freelancer', skills: ['Video editing', 'Graphics'], experience: ['6 years experience'], availability: 'Weekend only', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
        { name: 'Devansh Nair', email: 'freelancer-4@rozwork.com', location: 'Pune', profession: 'Freelancer', skills: ['Web development', 'Automation'], experience: ['7 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ishita Sen', email: 'freelancer-5@rozwork.com', location: 'Hyderabad', profession: 'Freelancer', skills: ['Branding', 'Copywriting'], experience: ['4 years experience'], availability: 'Available now', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
      ] },
    ]

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

    await Promise.all(categorySeedData.flatMap((category) => category.workers.map((worker) => upsertUser(
      { email: worker.email },
      {
        name: worker.name,
        email: worker.email,
        password: 'worker1234',
        role: 'worker',
        username: worker.email.split('@')[0],
        profession: worker.profession,
        bio: `${worker.profession} available for trusted local work.`,
        location: worker.location,
        serviceCategories: [category.name],
        skills: worker.skills,
        experience: worker.experience,
        availability: worker.availability,
        photo: worker.photo,
        ratings: 4.6 + Math.random() * 0.4,
        completedJobs: 12 + Math.floor(Math.random() * 18),
        earnings: 1200 + Math.floor(Math.random() * 6000),
      },
    ))))

    await Promise.all([
      upsertUser(
        { email: adminEmail },
        {
          name: 'RozWork Admin',
          email: adminEmail,
          password: 'admin123456',
          role: 'admin',
          username: 'rozworkadmin',
          phone: '9660585690',
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
          phone: '9660585692',
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
    ])

    if (existingJobs === 0) {
      await Job.create({
        title: 'Skilled Plumbing Repair',
        category: 'Skilled Trades',
        location: 'Delhi, India',
        salary: '₹900/day',
        description: 'Install and repair water lines and plumbing fixtures in a residential building.',
        postedBy: null,
        postedByRole: 'worker',
      })

      await Job.create({
        title: 'Farm Labour Support for Harvesting',
        category: 'Farm Labour',
        location: 'Nashik, India',
        salary: '₹400/day',
        description: 'Help with harvesting, field clearing, and crop handling for a local farm.',
        postedBy: null,
        postedByRole: 'worker',
      })
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

    if (existingGalleryItems === 0) {
      await GalleryItem.create([
        {
          title: 'Verified worker showcase',
          description: 'A polished collection of completed jobs from trusted professionals in the RozWork network.',
          category: 'Showcase',
          imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
          imageAlt: 'Professional workers collaborating at a site',
          location: 'Mumbai',
          tags: ['verified', 'workers', 'portfolio'],
          featured: true,
          status: 'published',
        },
        {
          title: 'On-site maintenance work',
          description: 'High-trust service stories captured from recent bookings and approved completions.',
          category: 'Maintenance',
          imageUrl: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1200&q=80',
          imageAlt: 'Technician performing maintenance work',
          location: 'Delhi',
          tags: ['maintenance', 'verification'],
          featured: true,
          status: 'published',
        },
      ])
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
    GalleryItem.deleteMany({}),
    LoginHistory.deleteMany({}),
    UserActivity.deleteMany({}),
    Booking.deleteMany({}),
    Purchase.deleteMany({}),
    Transaction.deleteMany({}),
    Payment.deleteMany({}),
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