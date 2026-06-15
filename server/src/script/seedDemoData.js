import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

import User from '../models/User.js'
import Job from '../models/Job.js'
import Booking from '../models/Booking.js'
import { connectToDatabase } from '../db/connect.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const categories = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Welder',
  'Mason',
  'Mechanic',
  'Cleaner',
  'Driver',
  'AC Technician',
  'Mobile Repair',
  'Tailor',
  'Gardener',
  'Construction Worker',
  'Other',
]

const cities = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kolkata',
  'Ahmedabad',
  'Nagpur',
  'Surat',
]

const firstNames = ['Aarav', 'Bhavya', 'Chirag', 'Deepak', 'Esha', 'Farhan', 'Gagan', 'Harsh', 'Ishaan', 'Jatin', 'Kavya', 'Lalit', 'Meera', 'Nikhil', 'Ojas', 'Pooja', 'Quaid', 'Raghav', 'Sakshi', 'Trisha', 'Udit', 'Vikram', 'Waseem', 'Xavier', 'Yash', 'Zara']
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Verma', 'Mehta', 'Kapoor', 'Rao', 'Gupta', 'Jain', 'Nair', 'Yadav', 'Malhotra', 'Bhatia', 'Chopra', 'Iyer', 'Joshi', 'Khan', 'Saxena', 'Mohan']

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

const getAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&size=256`

const getRandomItem = (items, index) => items[index % items.length]

const hashPassword = async (password) => bcrypt.hash(String(password), 10)

const getUniqueValue = async (Model, field, baseValue, fallback = '') => {
  const normalized = String(baseValue || fallback || 'demo').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  let candidate = normalized
  let suffix = 0

  while (true) {
    const existing = await Model.findOne({ [field]: candidate })
    if (!existing) {
      return candidate
    }
    suffix += 1
    candidate = `${normalized}-${suffix}`
  }
}

const upsertUser = async (payload) => {
  const existing = await User.findOne({
    $or: [
      ...(payload.email ? [{ email: payload.email }] : []),
      ...(payload.phone ? [{ phone: payload.phone }] : []),
      ...(payload.username ? [{ username: payload.username }] : []),
    ],
  })

  if (existing) {
    Object.assign(existing, payload)
    if (typeof payload.password === 'string' && payload.password.length > 0) {
      existing.password = await hashPassword(payload.password)
    }
    await existing.save()
    return existing
  }

  return User.create(payload)
}

const upsertJob = async (payload) => {
  const existing = await Job.findOne({ title: payload.title, postedBy: payload.postedBy })

  if (existing) {
    Object.assign(existing, payload)
    await existing.save()
    return existing
  }

  return Job.create(payload)
}

const buildWorkerProfile = async (category, categoryIndex, index) => {
  const firstName = getRandomItem(firstNames, index + category.length)
  const lastName = getRandomItem(lastNames, index + 3)
  const fullName = `${firstName} ${lastName}`
  const city = getRandomItem(cities, index + 7)
  const years = 1 + ((index + category.length) % 10)
  const username = await getUniqueValue(User, 'username', slugify(`${firstName}${lastName}${category}`))
  const emailBase = slugify(`${firstName}${lastName}${category}${categoryIndex + 1}${index + 1}`)
  const email = await getUniqueValue(User, 'email', `${emailBase}@rozwork.demo`)
  const phone = `+91${9000000000 + categoryIndex * 100 + index}`

  return {
    name: fullName,
    email,
    username,
    phone,
    password: 'demo123456',
    role: 'worker',
    profession: category,
    bio: `${fullName} is a trusted ${category.toLowerCase()} with strong local experience and quick response times.`,
    location: city,
    serviceCategories: [category],
    skills: [
      `${category} service`,
      'On-time delivery',
      'Customer support',
      'Safety focused',
    ],
    experience: [`${years} years experience`],
    photo: getAvatar(fullName),
    availability: 'Available now',
    ratings: Number((4.2 + ((index + 1) % 8) * 0.1).toFixed(1)),
    completedJobs: 2 + (index % 5),
    earnings: 4000 + index * 250,
    notificationsEnabled: true,
  }
}

const buildEmployerProfile = async (index) => {
  const companyNames = ['RozWork Home Services', 'UrbanFix Solutions', 'QuickCraft Crew', 'TrustMate Services', 'MetroHands Partners']
  const name = `${companyNames[index % companyNames.length]} ${index + 1}`
  const city = getRandomItem(cities, index + 2)
  const firstName = getRandomItem(firstNames, index + 5)
  const lastName = getRandomItem(lastNames, index + 9)
  const fullName = `${firstName} ${lastName}`
  const username = await getUniqueValue(User, 'username', slugify(`${firstName}${lastName}${index + 1}`))
  const email = await getUniqueValue(User, 'email', `employer${index + 1}@rozwork.demo`)
  const phone = `+91${9100000000 + index}`

  return {
    name: fullName,
    email,
    username,
    phone,
    password: 'employer123456',
    role: 'employer',
    companyName: name,
    profession: 'Employer',
    bio: `${fullName} manages trusted local service teams across ${city} and publishes skilled jobs on RozWork.`,
    location: city,
    photo: getAvatar(fullName),
    availability: 'Hiring now',
    isVerified: true,
    notificationsEnabled: true,
  }
}

const buildJobSeed = (category, employerId, index, city) => {
  const price = 500 + ((index + category.length) % 8) * 100
  const title = `${category} service ${index + 1}`

  return {
    title,
    category,
    location: city,
    salary: `₹${price}/day`,
    price,
    budget: `₹${price}/day`,
    jobDate: '',
    duration: 'Same day',
    description: `Need a reliable ${category.toLowerCase()} for urgent work in ${city}. Skilled professionals are welcome to apply with a fast turnaround.`,
    experienceRequired: `${1 + (index % 5)}+ years`,
    contactNumber: `+91${9200000000 + index}`,
    workType: index % 2 === 0 ? 'Full Time' : 'Part Time',
    postedBy: employerId,
    postedByRole: 'employer',
    status: 'approved',
    goalTags: index % 3 === 0 ? ['quick-income'] : [],
    applicants: [],
  }
}

const createDemoData = async () => {
  await connectToDatabase()

  console.log('🌱 Seeding demo users, jobs, and bookings...')

  const employers = []
  for (let index = 0; index < 5; index += 1) {
    const employerPayload = await buildEmployerProfile(index)
    const employer = await upsertUser(employerPayload)
    employers.push(employer)
  }

  let workersCreated = 0
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex]
    for (let index = 0; index < 5; index += 1) {
      const workerPayload = await buildWorkerProfile(category, categoryIndex, index)
      await upsertUser(workerPayload)
      workersCreated += 1
    }
  }

  let jobsCreated = 0
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex]
    const employer = employers[categoryIndex % employers.length]
    const city = getRandomItem(cities, categoryIndex + 3)

    for (let index = 0; index < 5; index += 1) {
      const jobPayload = buildJobSeed(category, employer._id, index, city)
      await upsertJob(jobPayload)
      jobsCreated += 1
    }
  }

  let bookingsCreated = 0
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex]

    const worker = await User.findOne({ role: 'worker', profession: category })
    const job = await Job.findOne({ category }).sort({ createdAt: 1 })

    if (worker && job) {
      if (!job.applicants.some((applicantId) => applicantId.toString() === worker._id.toString())) {
        job.applicants.push(worker._id)
        await job.save()
      }

      const existingBooking = await Booking.findOne({ jobId: job._id.toString(), workerId: worker._id })
      if (!existingBooking) {
        await Booking.create({
          employerId: job.postedBy,
          workerId: worker._id,
          userId: worker._id,
          providerId: job.postedBy,
          jobId: job._id.toString(),
          serviceTitle: job.title,
          serviceProvider: job.category,
          amount: Number(job.price || job.salary || 0),
          price: Number(job.price || job.salary || 0),
          category: job.category,
          status: 'pending',
          paymentStatus: 'pending',
          contactName: worker.name,
          contactEmail: worker.email,
          contactPhone: worker.phone || '',
          transactionId: `demo_booking_${Date.now()}_${bookingsCreated + 1}`,
        })
        bookingsCreated += 1
      }
    }
  }

  console.log(`✅ Demo seed complete: ${workersCreated} workers, ${employers.length} employers, ${jobsCreated} jobs, ${bookingsCreated} bookings.`)
}

createDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Demo seed failed:', error)
    process.exit(1)
  })
