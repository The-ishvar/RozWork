import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Purchase from '../models/Purchase.js'
import { addAuditLog } from '../utils/audit.js'
import { ensureDatabaseConnection } from '../db/connect.js'
import { notifyAdmins } from '../utils/notify.js'

const otpStore = new Map()

const getJwtSecret = () => process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'rozwork-dev-secret'

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()
const normalizePhone = (value) => String(value || '').trim()
const normalizeUsername = (value) => String(value || '').trim()

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

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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
  isVerified: user.isVerified !== false,
  isSuspended: !!user.isSuspended,
  isBanned: !!user.isBanned,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
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

    const existingUser = await User.findOne({ $or: [{ email: resolvedEmail }, ...(normalizedPhone ? [{ phone: normalizedPhone }] : []), ...(normalizedUsername ? [{ username: normalizedUsername }] : [])] })
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

    addAuditLog({ type: 'auth', action: 'register', userId: user._id.toString(), message: `${user.name} registered` })
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

    console.log('auth.login input', {
      identifierPresent: identifier !== undefined && identifier !== null,
      identifierValue: identifier,
      emailPresent: email !== undefined && email !== null,
      emailValue: email,
      loginIdentifier,
      passwordPresent: password !== undefined && password !== null,
    })

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', code: 'VALIDATION_ERROR' })
    }

    const normalizedIdentifier = loginIdentifier.trim()
    const user = await User.findOne({
      $or: [
        { email: normalizeEmail(normalizedIdentifier) },
        { phone: normalizedIdentifier },
        { username: { $regex: `^${escapeRegExp(normalizedIdentifier)}$`, $options: 'i' } },
      ],
    })

    console.log('auth.login resolved user', {
      found: !!user,
      userId: user?._id?.toString(),
      email: user?.email,
      phone: user?.phone,
      username: user?.username,
      role: user?.role,
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'We could not find an account with that email, phone, or username.', code: 'USER_NOT_FOUND' })
    }

    const isValidPassword = await user.comparePassword(password)
    console.log('auth.login comparePassword', { isValidPassword })

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
    }

    if (String(user.password) === String(password)) {
      user.password = password
      await user.save()
    }

    addAuditLog({ type: 'auth', action: 'login', userId: user._id.toString(), message: `${user.name} logged in` })
    await notifyAdmins({
      type: 'login',
      title: 'Member login',
      message: `${user.name} signed in to RozWork.`,
      relatedId: user._id,
      fromUserId: user._id,
    })

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

    const user = await User.findOne({ phone: String(phone).trim() })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`
    otpStore.set(String(phone).trim(), { otp, expiresAt: Date.now() + 5 * 60 * 1000, verified: false })

    return res.json({ success: true, message: 'OTP sent successfully', otp })
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

    const user = await User.findOne({ phone: String(phone).trim() })
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
