import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import { createNotification, notifyAdmins } from '../utils/notify.js'

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
    const employerId = req.body.employerId || req.body.userId || req.user.id
    const workerId = req.body.workerId || req.body.providerId || null

    if (!workerId) {
      return res.status(400).json({ message: 'A worker must be selected for the booking.' })
    }

    const amount = Number(req.body.price ?? req.body.amount ?? 0)
    const booking = await Booking.create({
      employerId,
      workerId,
      userId: employerId,
      providerId: workerId,
      jobId: req.body.jobId || req.body.serviceId || '',
      serviceId: req.body.serviceId || null,
      serviceTitle: req.body.serviceTitle || req.body.service || req.body.title || 'Service',
      serviceProvider: req.body.serviceProvider || '',
      amount,
      price: amount,
      category: req.body.category || req.body.serviceCategory || 'General',
      note: req.body.note || '',
      contactName: req.body.contactName || req.user.name,
      contactEmail: req.body.contactEmail || req.user.email,
      contactPhone: req.body.contactPhone || req.user.phone || '',
      transactionId: req.body.transactionId || `booking_${Date.now()}`,
      status: req.body.status || 'pending',
      paymentStatus: req.body.paymentStatus || 'pending',
    })

    await Promise.all([
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
    ])

    return res.status(201).json({ booking: serializeBooking(booking) })
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

    booking.status = 'completed'
    booking.verified = true
    booking.verificationStatus = 'approved'
    booking.paymentStatus = 'paid'
    booking.completedAt = new Date()
    await booking.save()

    const worker = await User.findById(booking.workerId)
    const amount = Number(booking.amount || booking.price || 0)
    if (worker) {
      worker.earnings = Number(worker.earnings || 0) + amount
      worker.completedJobs = Number(worker.completedJobs || 0) + 1
      await worker.save()
    }

    const payment = await Payment.create({
      workerId: booking.workerId,
      employerId: booking.employerId,
      bookingId: booking._id,
      amount,
      status: 'completed',
      date: new Date(),
    })

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
