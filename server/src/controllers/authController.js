import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Purchase from '../models/Purchase.js'
import LoginHistory from '../models/LoginHistory.js'
import { addAuditLog } from '../utils/audit.js'
import { ensureDatabaseConnection } from '../db/connect.js'
import { notifyAdmins } from '../utils/notify.js'
import { recordUserActivity } from '../utils/activity.js'

const otpStore = new Map()

const getJwtSecret = () => process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'rozwork-dev-secret'

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()
const normalizePhone = (value) => String(value || '').trim()
const normalizeUsername = (value) => String(value || '').trim()

const getPhoneDigits = (value) => String(value || '').replace(/\D/g, '')

const getPhoneCandidates = (value) => {
  const digits = getPhoneDigits(value)
  if (!digits) {
    return []
  }

  const candidates = new Set([digits])

  if (digits.length > 10) {
    candidates.add(digits.slice(-10))
  }

  if (/^([6-9]\d{9}|91[6-9]\d{9})$/.test(digits)) {
    candidates.add(digits.slice(-10))
    candidates.add(`91${digits.slice(-10)}`)
  }

  return [...candidates]
}

const getPhonePatterns = (value) => {
  const digits = getPhoneDigits(value)
  if (!digits) {
    return []
  }

  return getPhoneCandidates(value).map((candidate) => candidate.split('').map((char) => `${char}[^0-9]*`).join(''))
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getClientMeta = (req) => {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0]?.trim()
  return {
    ipAddress: forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown',
    device: String(req.get('user-agent') || '').slice(0, 180) || 'unknown',
  }
}

const buildEmailFromIdentity = (name, phone, username) => {
  const fallbackBase = normalizeUsername(username) || normalizePhone(phone) || String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (!fallbackBase) {
    return ''
  }

  return `${fallbackBase}@rozwork.local`
}

const buildUsernameFromIdentity = (name, email, phone) => {
  const source = normalizeUsername(name) || normalizeEmail(email) || normalizePhone(phone)
  if (!source) {
    return ''
  }

  return source.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const createToken = (user) =>
  jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, getJwtSecret(), {
    expiresIn: '7d',
  })

const requireDatabase = async (res) => {
  const isConnected = await ensureDatabaseConnection()
  if (!isConnected) {
    res.status(503).json({
      success: false,
      message: 'Database unavailable. Please try again later.',
      code: 'DB_UNAVAILABLE',
    })
    return false
  }

  return true
}

const serializeUser = (user, purchases = []) => ({
  id: user._id ? user._id.toString() : user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  username: user.username || '',
  serviceCategories: user.serviceCategories || [],
  role: user.role,
  bio: user.bio || '',
  location: user.location || '',
  profession: user.profession || '',
  skills: user.skills || [],
  experience: user.experience || [],
  education: user.education || [],
  certificates: user.certificates || [],
  portfolio: user.portfolio || [],
  socialLinks: user.socialLinks || [],
  companyName: user.companyName || '',
  businessDetails: user.businessDetails || '',
  availability: user.availability || 'Available now',
  notificationsEnabled: user.notificationsEnabled !== false,
  photo: user.photo || '',
  ratings: user.ratings || 0,
  completedJobs: user.completedJobs || 0,
  earnings: user.earnings || 0,
  isPremium: !!user.isPremium,
  premiumPlan: user.premiumPlan || '',
  premiumExpiryDate: user.premiumExpiryDate || null,
  isVerified: user.isVerified !== false,
  isSuspended: !!user.isSuspended,
  isBanned: !!user.isBanned,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastActiveAt: user.lastActiveAt,
  purchases,
})

export const register = async (req, res, next) => {
  try {
    if (!(await requireDatabase(res))) {
      return
    }

    const { name, email, password, role = 'user', phone, username = '', serviceCategories = [], location = '', profession = '', ...rest } = req.body

    if (!name || !password) {
      return res.status(400).json({ success: false, message: 'Name and password are required', code: 'VALIDATION_ERROR' })
    }

    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhone(phone) || undefined
    const normalizedUsername = normalizeUsername(username) || buildUsernameFromIdentity(name, email, phone)
    const resolvedEmail = normalizedEmail || buildEmailFromIdentity(name, normalizedPhone, normalizedUsername)

    if (!resolvedEmail) {
      return res.status(400).json({ success: false, message: 'A valid email or phone number is required', code: 'VALIDATION_ERROR' })
    }

    const phoneChecks = normalizedPhone
      ? [
          ...getPhoneCandidates(normalizedPhone).map((phone) => ({ phone })),
          ...getPhonePatterns(normalizedPhone).map((pattern) => ({ phone: { $regex: pattern } })),
        ]
      : []

    const existingUser = await User.findOne({ $or: [{ email: resolvedEmail }, ...phoneChecks, ...(normalizedUsername ? [{ username: normalizedUsername }] : [])] })
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists', code: 'USER_EXISTS' })
    }

    const userPayload = {
      name: String(name).trim(),
      email: resolvedEmail,
      password,
      role: ['admin', 'super_admin', 'worker', 'employer', 'user'].includes(role) ? role : 'user',
      username: normalizedUsername,
      serviceCategories: Array.isArray(serviceCategories) ? serviceCategories.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [],
      location: String(location || '').trim(),
      profession: String(profession || '').trim(),
      ...rest,
    }

    if (normalizedPhone !== undefined) {
      userPayload.phone = normalizedPhone
    }

    const user = await User.create(userPayload)

    const clientMeta = getClientMeta(req)
    addAuditLog({
      type: 'auth',
      action: 'register',
      userId: user._id.toString(),
      username: user.username || user.email,
      role: user.role,
      message: `${user.name} registered`,
      ipAddress: clientMeta.ipAddress,
      device: clientMeta.device,
    })
    await notifyAdmins({
      type: 'registration',
      title: 'New registration',
      message: `${user.name} joined RozWork as ${user.role}.`,
      relatedId: user._id,
      fromUserId: user._id,
    })

    const token = createToken(user)
    const purchases = await Purchase.find({ userId: user._id }).lean()

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: serializeUser(user, purchases),
    })
  } catch (error) {
    console.error('auth.register failed', error)
    return res.status(500).json({ success: false, message: error.message || 'Unable to create account', code: 'AUTH_REGISTER_FAILED' })
  }
}

export const login = async (req, res, next) => {
  try {
    if (!(await requireDatabase(res))) {
      return
    }

    const { identifier, email, password } = req.body
    const loginIdentifier = String(identifier || email || '').trim()

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', code: 'VALIDATION_ERROR' })
    }

    const normalizedIdentifier = loginIdentifier.trim()
    const phoneCandidates = getPhoneCandidates(normalizedIdentifier)
    const phonePatterns = getPhonePatterns(normalizedIdentifier)

    const user = await User.findOne({
      $or: [
        { email: normalizeEmail(normalizedIdentifier) },
        { phone: normalizedIdentifier },
        ...phoneCandidates.map((phone) => ({ phone })),
        ...phonePatterns.map((pattern) => ({ phone: { $regex: pattern } })),
        { username: { $regex: `^${escapeRegExp(normalizedIdentifier)}$`, $options: 'i' } },
      ],
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'We could not find an account with that email, phone, or username.', code: 'USER_NOT_FOUND' })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
    }

    if (String(user.password) === String(password)) {
      user.password = password
      await user.save()
    }

    const clientMeta = getClientMeta(req)
    user.lastActiveAt = new Date()
    await user.save({ validateBeforeSave: false })

    await Promise.allSettled([
      LoginHistory.create({
        userId: user._id,
        username: user.username || user.email,
        fullName: user.name,
        email: user.email,
        role: user.role,
        loginAt: new Date(),
        lastActiveAt: new Date(),
        ipAddress: clientMeta.ipAddress,
        deviceInfo: clientMeta.device,
      }),
      recordUserActivity({
        userId: user._id,
        username: user.username || user.email,
        fullName: user.name,
        email: user.email,
        role: user.role,
        action: 'login',
        entityType: 'auth',
        details: 'Successful login',
        ipAddress: clientMeta.ipAddress,
        deviceInfo: clientMeta.device,
      }),
      addAuditLog({
        type: 'auth',
        action: 'login',
        userId: user._id.toString(),
        username: user.username || user.email,
        role: user.role,
        message: `${user.name} logged in`,
        ipAddress: clientMeta.ipAddress,
        device: clientMeta.device,
      }),
      notifyAdmins({
        type: 'login',
        title: 'Member login',
        message: `${user.name} signed in to RozWork.`,
        relatedId: user._id,
        fromUserId: user._id,
      }),
    ])

    const token = createToken(user)
    const purchases = await Purchase.find({ userId: user._id }).lean()

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: serializeUser(user, purchases),
    })
  } catch (error) {
    console.error('auth.login failed', error)
    return res.status(500).json({ success: false, message: error.message || 'Unable to sign in', code: 'AUTH_LOGIN_FAILED' })
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    if (!(await requireDatabase(res))) {
      return
    }

    const { phone } = req.body
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required', code: 'VALIDATION_ERROR' })
    }

    const user = await User.findOne({
      $or: [
        { phone: String(phone).trim() },
        ...getPhoneCandidates(phone).map((candidate) => ({ phone: candidate })),
        ...getPhonePatterns(phone).map((pattern) => ({ phone: { $regex: pattern } })),
      ],
    })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`
    otpStore.set(String(phone).trim(), { otp, expiresAt: Date.now() + 5 * 60 * 1000, verified: false })

    return res.json({ success: true, message: 'OTP sent successfully' })
  } catch (error) {
    console.error('auth.forgotPassword failed', error)
    return res.status(500).json({ success: false, message: error.message || 'Unable to send OTP', code: 'OTP_FAILED' })
  }
}

export const verifyOtp = async (req, res, next) => {
  try {
    if (!(await requireDatabase(res))) {
      return
    }

    const { phone, otp } = req.body
    const entry = otpStore.get(String(phone).trim())

    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid', code: 'OTP_INVALID' })
    }

    if (entry.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP', code: 'OTP_INVALID' })
    }

    entry.verified = true
    return res.json({ success: true, message: 'OTP verified successfully' })
  } catch (error) {
    console.error('auth.verifyOtp failed', error)
    return res.status(500).json({ success: false, message: error.message || 'Unable to verify OTP', code: 'OTP_VERIFY_FAILED' })
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    if (!(await requireDatabase(res))) {
      return
    }

    const { phone, otp, password } = req.body
    const entry = otpStore.get(String(phone).trim())

    if (!entry || !entry.verified || entry.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP verification required', code: 'OTP_REQUIRED' })
    }

    if (entry.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP', code: 'OTP_INVALID' })
    }

    const user = await User.findOne({
      $or: [
        { phone: String(phone).trim() },
        ...getPhoneCandidates(phone).map((candidate) => ({ phone: candidate })),
        ...getPhonePatterns(phone).map((pattern) => ({ phone: { $regex: pattern } })),
      ],
    })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    user.password = password
    await user.save()
    otpStore.delete(String(phone).trim())
    addAuditLog({ type: 'auth', action: 'reset-password', userId: user._id.toString(), message: `${user.name} reset password` })

    return res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('auth.resetPassword failed', error)
    return res.status(500).json({ success: false, message: error.message || 'Unable to reset password', code: 'PASSWORD_RESET_FAILED' })
  }
}

export const me = async (req, res, next) => {
  try {
    if (!(await requireDatabase(res))) {
      return
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    const purchases = await Purchase.find({ userId: user._id }).lean()

    return res.json({
      success: true,
      user: serializeUser(user, purchases),
    })      
  } catch (error) {
    console.error('auth.me failed', error)
    return res.status(500).json({ success: false, message: error.message || 'Unable to load profile', code: 'AUTH_ME_FAILED' })
  }
}
