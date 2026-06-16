import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'
import Job from '../models/Job.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import Setting from '../models/Setting.js'
import { createNotification, notifyAdmins } from '../utils/notify.js'
import { recordUserActivity } from '../utils/activity.js'
import { emitPlatformEvent } from '../utils/events.js'

const defaultPlatformSettings = {
  platformCommission: 5,
  applicationFee: 20,
}

const loadPlatformSettings = async () => {
  const settings = await Setting.find({}).lean()
  return { ...defaultPlatformSettings, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) }
}

const serializeBooking = (booking) => ({
  id: booking._id ? booking._id.toString() : booking.id,
  employerId: booking.employerId ? booking.employerId.toString() : null,
  workerId: booking.workerId ? booking.workerId.toString() : null,
  userId: booking.userId ? booking.userId.toString() : '',
  providerId: booking.providerId ? booking.providerId.toString() : null,
  jobId: booking.jobId || '',
  serviceId: booking.serviceId ? booking.serviceId.toString() : null,
  serviceTitle: booking.serviceTitle,
  serviceProvider: booking.serviceProvider,
  amount: booking.amount ?? booking.price ?? 0,
  price: booking.price ?? booking.amount ?? 0,
  category: booking.category || 'General',
  currency: booking.currency,
  platformCommissionPercentage: booking.platformCommissionPercentage || 0,
  platformCommissionAmount: booking.platformCommissionAmount || 0,
  workerAmount: booking.workerAmount || 0,
  status: booking.status,
  verified: booking.verified ?? false,
  verificationStatus: booking.verificationStatus || 'pending',
  completedAt: booking.completedAt,
  paymentStatus: booking.paymentStatus,
  note: booking.note,
  contactName: booking.contactName,
  contactEmail: booking.contactEmail,
  contactPhone: booking.contactPhone,
  transactionId: booking.transactionId,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
})

const buildBookingQuery = (userId) => ({
  $or: [{ employerId: userId }, { workerId: userId }, { userId }, { providerId: userId }],
})

export const listBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find(buildBookingQuery(req.user.id)).sort({ createdAt: -1 }).lean()
    return res.json({ bookings: bookings.map(serializeBooking) })
  } catch (error) {
    console.error('bookings.list failed', error)
    next(error)
  }
}

export const createBooking = async (req, res, next) => {
  try {
    const employerId = req.body.employerId || req.body.userId || req.body.providerId || (req.user.role === 'employer' ? req.user.id : null)
    const workerId = req.body.workerId || req.body.providerId || (req.user.role === 'worker' ? req.user.id : null)

    if (!employerId || !workerId) {
      return res.status(400).json({ message: 'Both an employer and a worker must be selected for the booking.' })
    }

    const amount = Number(req.body.price ?? req.body.amount ?? req.body.budget ?? 0)
    const transactionId = req.body.transactionId || `booking_${Date.now()}`
    const bookingFee = 20

    const payment = await Payment.create({
      userId: employerId,
      employerId,
      workerId,
      amount: bookingFee,
      paymentType: 'booking_fee',
      status: 'completed',
      transactionId: `${transactionId}_fee`,
    })

    const booking = await Booking.create({
      employerId,
      workerId,
      userId: workerId,
      providerId: employerId,
      jobId: req.body.jobId || req.body.serviceId || '',
      serviceId: req.body.serviceId || null,
      serviceTitle: req.body.serviceTitle || req.body.service || req.body.title || 'Service',
      serviceProvider: req.body.serviceProvider || '',
      amount: Number.isFinite(amount) ? amount : 0,
      price: Number.isFinite(amount) ? amount : 0,
      category: req.body.category || req.body.serviceCategory || 'General',
      note: req.body.note || '',
      contactName: req.body.contactName || req.user.name,
      contactEmail: req.body.contactEmail || req.user.email,
      contactPhone: req.body.contactPhone || req.user.phone || '',
      transactionId,
      status: req.body.status || 'pending',
      paymentStatus: 'paid',
    })

    payment.bookingId = booking._id
    await payment.save()

    await Promise.allSettled([
      createNotification({
        userId: workerId,
        type: 'booking_received',
        title: 'Booking received',
        message: `${req.user.name || 'An employer'} requested your service for ${booking.serviceTitle}.`,
        relatedId: booking._id,
        fromUserId: employerId,
      }),
      createNotification({
        userId: employerId,
        type: 'booking_created',
        title: 'Booking created',
        message: `Your booking for ${booking.serviceTitle} is now pending worker review.`,
        relatedId: booking._id,
        fromUserId: workerId,
      }),
      notifyAdmins({
        type: 'booking',
        title: 'New booking received',
        message: `${req.user.name || 'A user'} booked ${booking.serviceTitle || 'a service'}.`,
        relatedId: booking._id,
        fromUserId: employerId,
      }),
      recordUserActivity({
        userId: workerId,
        username: req.user.username || req.user.email || 'member',
        fullName: req.user.name,
        email: req.user.email,
        role: req.user.role,
        action: 'booking_created',
        entityType: 'booking',
        entityId: booking._id.toString(),
        entityTitle: booking.serviceTitle,
        details: 'Submitted a new booking application',
      }),
    ])

    emitPlatformEvent('booking.created', {
      bookingId: booking._id.toString(),
      employerId: booking.employerId?.toString(),
      workerId: booking.workerId?.toString(),
      amount: booking.amount,
      paymentAmount: payment?.amount || 0,
      paymentType: payment?.paymentType || 'booking_fee',
    })

    return res.status(201).json({
      booking: serializeBooking(booking),
      payment: payment ? { id: payment._id.toString(), amount: payment.amount, paymentType: payment.paymentType, status: payment.status, transactionId: payment.transactionId } : null,
    })
  } catch (error) {
    console.error('bookings.create failed', error)
    next(error)
  }
}

export const acceptBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.workerId?.toString() !== req.user.id && booking.providerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned worker can accept this booking.' })
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}.` })
    }

    booking.status = 'accepted'
    booking.paymentStatus = 'pending'
    await booking.save()

    await Promise.all([
      createNotification({
        userId: booking.employerId,
        type: 'booking_accepted',
        title: 'Booking accepted',
        message: `Your booking for ${booking.serviceTitle} has been accepted by the worker.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      createNotification({
        userId: booking.workerId,
        type: 'booking_accepted',
        title: 'Booking accepted',
        message: `You accepted the booking for ${booking.serviceTitle}.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
    ])

    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.accept failed', error)
    next(error)
  }
}

export const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.workerId?.toString() !== req.user.id && booking.providerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned worker can reject this booking.' })
    }

    booking.status = 'rejected'
    booking.paymentStatus = 'failed'
    await booking.save()

    await Promise.all([
      createNotification({
        userId: booking.employerId,
        type: 'booking_rejected',
        title: 'Booking rejected',
        message: `The booking for ${booking.serviceTitle} was rejected by the worker.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      createNotification({
        userId: booking.workerId,
        type: 'booking_rejected',
        title: 'Booking rejected',
        message: `You rejected the booking for ${booking.serviceTitle}.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
    ])

    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.reject failed', error)
    next(error)
  }
}

export const completeBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.workerId?.toString() !== req.user.id && booking.providerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned worker can mark this work as complete.' })
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: `Booking must be accepted before work can be completed.` })
    }

    booking.status = 'waiting_for_verification'
    booking.verificationStatus = 'pending'
    booking.completedAt = null
    booking.verified = false
    await booking.save()

    await Promise.all([
      createNotification({
        userId: booking.employerId,
        type: 'verification_requested',
        title: 'Verification requested',
        message: `The worker marked ${booking.serviceTitle} as complete and needs your verification.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      createNotification({
        userId: booking.workerId,
        type: 'verification_requested',
        title: 'Verification requested',
        message: `You requested verification for ${booking.serviceTitle}.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
    ])

    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.complete failed', error)
    next(error)
  }
}

export const verifyBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.employerId?.toString() !== req.user.id && booking.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the employer can verify this booking.' })
    }
    if (booking.status !== 'waiting_for_verification') {
      return res.status(400).json({ message: `Booking is not awaiting verification.` })
    }

    const settings = await loadPlatformSettings()
    const amount = Number(booking.amount || booking.price || 0)
    const platformCommissionPercentage = Number(settings.platformCommission ?? 5)
    const platformCommissionAmount = Number(((amount * platformCommissionPercentage) / 100).toFixed(2))
    const workerAmount = Math.max(0, amount - platformCommissionAmount)

    booking.status = 'completed'
    booking.verified = true
    booking.verificationStatus = 'approved'
    booking.paymentStatus = 'paid'
    booking.completedAt = new Date()
    booking.platformCommissionPercentage = platformCommissionPercentage
    booking.platformCommissionAmount = platformCommissionAmount
    booking.workerAmount = workerAmount
    await booking.save()

    const worker = await User.findById(booking.workerId)
    const employer = await User.findById(booking.employerId || booking.userId || booking.providerId)

    if (worker) {
      worker.earnings = Number(worker.earnings || 0) + workerAmount
      worker.completedJobs = Number(worker.completedJobs || 0) + 1
      await worker.save()
    }

    if (employer) {
      employer.totalSpent = Number(employer.totalSpent || 0) + amount
      employer.completedJobs = Number(employer.completedJobs || 0) + 1
      await employer.save()
    }

    await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' }, { new: true }).catch(() => {})

    const payment = await Payment.create({
      userId: booking.employerId || booking.userId || booking.providerId,
      workerId: booking.workerId,
      employerId: booking.employerId || booking.userId || booking.providerId,
      bookingId: booking._id,
      amount,
      totalAmount: amount,
      commissionAmount: platformCommissionAmount,
      workerAmount,
      paymentType: 'service_payment',
      status: 'completed',
      transactionId: booking.transactionId || `service_${Date.now()}`,
      date: new Date(),
    })

    if (employer) {
      await Transaction.create({
        userId: employer._id,
        type: 'payment',
        amount,
        currency: 'INR',
        status: 'completed',
        reference: payment._id.toString(),
        description: `Payment received for ${booking.serviceTitle}`,
      })
    }

    await Promise.all([
      createNotification({
        userId: booking.workerId,
        type: 'verification_approved',
        title: 'Verification approved',
        message: `Your work for ${booking.serviceTitle} has been approved and the payment is complete.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
      createNotification({
        userId: booking.employerId,
        type: 'verification_approved',
        title: 'Verification approved',
        message: `You verified ${booking.serviceTitle} and the payment has been recorded.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
    ])

    return res.json({ booking: serializeBooking(booking), payment: { id: payment._id.toString(), amount: payment.amount, status: payment.status, date: payment.date } })
  } catch (error) {
    console.error('bookings.verify failed', error)
    next(error)
  }
}

export const rejectVerification = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.employerId?.toString() !== req.user.id && booking.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the employer can reject verification for this booking.' })
    }

    booking.status = 'verification_rejected'
    booking.verified = false
    booking.verificationStatus = 'rejected'
    booking.paymentStatus = 'pending'
    await booking.save()

    await Promise.all([
      createNotification({
        userId: booking.workerId,
        type: 'verification_rejected',
        title: 'Verification rejected',
        message: `Your submitted work for ${booking.serviceTitle} needs revision before payment can be released.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
      createNotification({
        userId: booking.employerId,
        type: 'verification_rejected',
        title: 'Verification rejected',
        message: `You rejected verification for ${booking.serviceTitle}.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
    ])

    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.rejectVerification failed', error)
    next(error)
  }
}

export default { listBookings, createBooking, acceptBooking, rejectBooking, completeBooking, verifyBooking, rejectVerification }
