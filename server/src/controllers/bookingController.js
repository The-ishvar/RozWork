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
  employerCommission: 10,
  workerCommission: 2,
  applicationFee: 20,
  razorpayEnabled: true,
  upiEnabled: true,
  phonepeEnabled: true,
  gpayEnabled: true,
  paytmEnabled: true,
  minBookingAmount: 100,
  maxBookingAmount: 1000000,
  autoCancelDays: 7,
}

const loadPlatformSettings = async () => {
  const settings = await Setting.find({}).lean()
  return { ...defaultPlatformSettings, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) }
}

const calculateCommissions = (jobPrice, settings) => {
  const employerCommissionPct = Number(settings.employerCommission ?? 10)
  const workerCommissionPct = Number(settings.workerCommission ?? 2)
  const employerCommissionAmount = Number(((jobPrice * employerCommissionPct) / 100).toFixed(2))
  const workerCommissionAmount = Number(((jobPrice * workerCommissionPct) / 100).toFixed(2))
  const totalPlatformCommission = Number((employerCommissionAmount + workerCommissionAmount).toFixed(2))
  const employerPays = Number((jobPrice + employerCommissionAmount).toFixed(2))
  const workerReceives = Number((jobPrice - workerCommissionAmount).toFixed(2))
  return {
    employerCommissionPct,
    workerCommissionPct,
    employerCommissionAmount,
    workerCommissionAmount,
    totalPlatformCommission,
    employerPays,
    workerReceives,
  }
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
  estimatedBudget: booking.estimatedBudget || 0,
  category: booking.category || 'General',
  currency: booking.currency,
  address: booking.address || '',
  village: booking.village || '',
  bookingDate: booking.bookingDate || '',
  bookingTime: booking.bookingTime || '',
  description: booking.description || '',
  employerCommissionPercentage: booking.employerCommissionPercentage || 0,
  employerCommissionAmount: booking.employerCommissionAmount || 0,
  workerCommissionPercentage: booking.workerCommissionPercentage || 0,
  workerCommissionAmount: booking.workerCommissionAmount || 0,
  totalPlatformCommission: booking.totalPlatformCommission || 0,
  employerPays: booking.employerPays || 0,
  workerReceives: booking.workerReceives || 0,
  status: booking.status,
  verified: booking.verified ?? false,
  verificationStatus: booking.verificationStatus || 'pending',
  completedAt: booking.completedAt,
  paymentStatus: booking.paymentStatus,
  paymentMethod: booking.paymentMethod || '',
  refundStatus: booking.refundStatus || 'none',
  refundAmount: booking.refundAmount || 0,
  refundDate: booking.refundDate,
  refundReason: booking.refundReason || '',
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
    const { status, page = 1, limit = 20 } = req.query
    const query = buildBookingQuery(req.user.id)
    if (status) query.status = status

    const total = await Booking.countDocuments(query)
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean()

    return res.json({
      bookings: bookings.map(serializeBooking),
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    console.error('bookings.list failed', error)
    next(error)
  }
}

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).lean()
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.getById failed', error)
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

    if (employerId === workerId) {
      return res.status(400).json({ message: 'You cannot book yourself.' })
    }

    const settings = await loadPlatformSettings()
    const jobPrice = Number(req.body.price ?? req.body.amount ?? req.body.estimatedBudget ?? req.body.budget ?? 0)
    const minAmount = Number(settings.minBookingAmount ?? 100)
    const maxAmount = Number(settings.maxBookingAmount ?? 1000000)

    if (jobPrice < minAmount) {
      return res.status(400).json({ message: `Minimum booking amount is ₹${minAmount}.` })
    }
    if (jobPrice > maxAmount) {
      return res.status(400).json({ message: `Maximum booking amount is ₹${maxAmount}.` })
    }

    const duplicate = await Booking.findOne({
      employerId,
      workerId,
      status: { $in: ['pending', 'accepted', 'waiting_for_verification'] },
    })
    if (duplicate) {
      return res.status(409).json({ message: 'A booking with this worker is already active.' })
    }

    const commissions = calculateCommissions(jobPrice, settings)
    const transactionId = req.body.transactionId || `booking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const bookingFee = 20

    const payment = await Payment.create({
      userId: employerId,
      employerId,
      workerId,
      amount: bookingFee,
      paymentType: 'booking_fee',
      status: 'completed',
      transactionId: `${transactionId}_fee`,
      paymentMethod: req.body.paymentMethod || '',
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
      amount: jobPrice,
      price: jobPrice,
      estimatedBudget: Number(req.body.estimatedBudget || jobPrice),
      category: req.body.category || req.body.serviceCategory || 'General',
      address: req.body.address || '',
      village: req.body.village || '',
      bookingDate: req.body.bookingDate || req.body.date || '',
      bookingTime: req.body.bookingTime || req.body.time || '',
      description: req.body.description || req.body.note || '',
      note: req.body.note || '',
      contactName: req.body.contactName || req.user.name,
      contactEmail: req.body.contactEmail || req.user.email,
      contactPhone: req.body.contactPhone || req.user.phone || '',
      transactionId,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: req.body.paymentMethod || '',
      employerCommissionPercentage: commissions.employerCommissionPct,
      employerCommissionAmount: commissions.employerCommissionAmount,
      workerCommissionPercentage: commissions.workerCommissionPct,
      workerCommissionAmount: commissions.workerCommissionAmount,
      totalPlatformCommission: commissions.totalPlatformCommission,
      employerPays: commissions.employerPays,
      workerReceives: commissions.workerReceives,
    })

    payment.bookingId = booking._id
    await payment.save()

    await Promise.allSettled([
      createNotification({
        userId: workerId,
        type: 'booking_received',
        title: 'New Booking Received',
        message: `${req.user.name || 'An employer'} has booked you for ${booking.serviceTitle}. Amount: ₹${commissions.employerPays} (incl. commission).`,
        relatedId: booking._id,
        fromUserId: employerId,
      }),
      createNotification({
        userId: employerId,
        type: 'booking_created',
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.serviceTitle} has been created. You will pay ₹${commissions.employerPays} (₹${jobPrice} + ₹${commissions.employerCommissionAmount} commission).`,
        relatedId: booking._id,
        fromUserId: workerId,
      }),
      notifyAdmins({
        type: 'booking',
        title: 'New Booking',
        message: `${req.user.name || 'A user'} booked ${booking.serviceTitle || 'a service'} for ₹${jobPrice}. Commission: ₹${commissions.totalPlatformCommission}.`,
        relatedId: booking._id,
        fromUserId: employerId,
      }),
      recordUserActivity({
        userId: employerId,
        username: req.user.username || req.user.email || 'member',
        fullName: req.user.name,
        email: req.user.email,
        role: req.user.role,
        action: 'booking_created',
        entityType: 'booking',
        entityId: booking._id.toString(),
        entityTitle: booking.serviceTitle,
        details: `Created booking for ₹${jobPrice} with ${commissions.totalPlatformCommission} commission`,
      }),
    ])

    emitPlatformEvent('booking.created', {
      bookingId: booking._id.toString(),
      employerId: booking.employerId?.toString(),
      workerId: booking.workerId?.toString(),
      amount: jobPrice,
      employerPays: commissions.employerPays,
      workerReceives: commissions.workerReceives,
      commission: commissions.totalPlatformCommission,
    })

    return res.status(201).json({
      booking: serializeBooking(booking),
      payment: payment ? {
        id: payment._id.toString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
        status: payment.status,
        transactionId: payment.transactionId,
      } : null,
      commission: {
        jobPrice,
        employerCommission: commissions.employerCommissionAmount,
        workerCommission: commissions.workerCommissionAmount,
        totalCommission: commissions.totalPlatformCommission,
        employerPays: commissions.employerPays,
        workerReceives: commissions.workerReceives,
      },
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
        title: 'Booking Accepted',
        message: `Your booking for ${booking.serviceTitle} has been accepted by the worker. They will start working soon.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      createNotification({
        userId: booking.workerId,
        type: 'booking_accepted',
        title: 'Booking Accepted',
        message: `You accepted the booking for ${booking.serviceTitle}. Complete the work to receive payment.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
      notifyAdmins({
        type: 'booking',
        title: 'Booking Accepted',
        message: `Worker accepted the booking for ${booking.serviceTitle}.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
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
        title: 'Booking Rejected',
        message: `The booking for ${booking.serviceTitle} was rejected by the worker. Please try another worker.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      createNotification({
        userId: booking.workerId,
        type: 'booking_rejected',
        title: 'Booking Rejected',
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
      return res.status(400).json({ message: 'Booking must be accepted before work can be completed.' })
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
        title: 'Work Completed - Verification Needed',
        message: `The worker marked ${booking.serviceTitle} as complete. Please verify and approve the work to release payment.`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      createNotification({
        userId: booking.workerId,
        type: 'verification_requested',
        title: 'Work Marked Complete',
        message: `You marked ${booking.serviceTitle} as complete. Waiting for employer verification.`,
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
      return res.status(400).json({ message: 'Booking is not awaiting verification.' })
    }

    const settings = await loadPlatformSettings()
    const jobPrice = Number(booking.amount || booking.price || 0)
    const commissions = calculateCommissions(jobPrice, settings)

    booking.status = 'completed'
    booking.verified = true
    booking.verificationStatus = 'approved'
    booking.paymentStatus = 'paid'
    booking.completedAt = new Date()
    booking.employerCommissionPercentage = commissions.employerCommissionPct
    booking.employerCommissionAmount = commissions.employerCommissionAmount
    booking.workerCommissionPercentage = commissions.workerCommissionPct
    booking.workerCommissionAmount = commissions.workerCommissionAmount
    booking.totalPlatformCommission = commissions.totalPlatformCommission
    booking.employerPays = commissions.employerPays
    booking.workerReceives = commissions.workerReceives
    await booking.save()

    const worker = await User.findById(booking.workerId)
    const employer = await User.findById(booking.employerId || booking.userId || booking.providerId)

    if (worker) {
      worker.earnings = Number(worker.earnings || 0) + commissions.workerReceives
      worker.completedJobs = Number(worker.completedJobs || 0) + 1
      worker.walletBalance = Number(worker.walletBalance || 0) + commissions.workerReceives
      worker.totalCommissionPaid = Number(worker.totalCommissionPaid || 0) + commissions.workerCommissionAmount
      await worker.save()
    }

    if (employer) {
      employer.totalSpent = Number(employer.totalSpent || 0) + commissions.employerPays
      employer.completedJobs = Number(employer.completedJobs || 0) + 1
      employer.totalCommissionPaid = Number(employer.totalCommissionPaid || 0) + commissions.employerCommissionAmount
      await employer.save()
    }

    await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' }, { new: true }).catch(() => {})

    const payment = await Payment.create({
      userId: booking.employerId || booking.userId || booking.providerId,
      workerId: booking.workerId,
      employerId: booking.employerId || booking.userId || booking.providerId,
      bookingId: booking._id,
      amount: jobPrice,
      totalAmount: commissions.employerPays,
      commissionAmount: commissions.totalPlatformCommission,
      employerCommission: commissions.employerCommissionAmount,
      workerCommission: commissions.workerCommissionAmount,
      workerAmount: commissions.workerReceives,
      paymentType: 'service_payment',
      status: 'completed',
      transactionId: booking.transactionId || `service_${Date.now()}`,
      paymentMethod: booking.paymentMethod || '',
      date: new Date(),
    })

    if (employer) {
      await Transaction.create({
        userId: employer._id,
        type: 'payment',
        amount: commissions.employerPays,
        currency: 'INR',
        status: 'completed',
        reference: payment._id.toString(),
        bookingId: booking._id,
        paymentId: payment._id,
        description: `Payment for ${booking.serviceTitle} (₹${jobPrice} + ₹${commissions.employerCommissionAmount} commission)`,
      })

      await Transaction.create({
        userId: employer._id,
        type: 'commission_employer',
        amount: commissions.employerCommissionAmount,
        currency: 'INR',
        status: 'completed',
        reference: payment._id.toString(),
        bookingId: booking._id,
        paymentId: payment._id,
        description: `Employer commission (${commissions.employerCommissionPct}%) for ${booking.serviceTitle}`,
      })
    }

    if (worker) {
      await Transaction.create({
        userId: worker._id,
        type: 'booking',
        amount: commissions.workerReceives,
        currency: 'INR',
        status: 'completed',
        reference: payment._id.toString(),
        bookingId: booking._id,
        paymentId: payment._id,
        balanceAfter: worker.walletBalance,
        description: `Earnings for ${booking.serviceTitle} (₹${jobPrice} - ₹${commissions.workerCommissionAmount} commission)`,
      })

      await Transaction.create({
        userId: worker._id,
        type: 'commission_worker',
        amount: commissions.workerCommissionAmount,
        currency: 'INR',
        status: 'completed',
        reference: payment._id.toString(),
        bookingId: booking._id,
        paymentId: payment._id,
        description: `Worker commission (${commissions.workerCommissionPct}%) for ${booking.serviceTitle}`,
      })
    }

    await Promise.all([
      createNotification({
        userId: booking.workerId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Your work for ${booking.serviceTitle} has been verified! You received ₹${commissions.workerReceives} (after ₹${commissions.workerCommissionAmount} commission).`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
      createNotification({
        userId: booking.employerId,
        type: 'verification_approved',
        title: 'Work Verified',
        message: `You verified ${booking.serviceTitle}. Total paid: ₹${commissions.employerPays} (₹${jobPrice} + ₹${commissions.employerCommissionAmount} commission).`,
        relatedId: booking._id,
        fromUserId: booking.workerId,
      }),
      notifyAdmins({
        type: 'payment',
        title: 'Payment Completed',
        message: `Booking for ${booking.serviceTitle} completed. Platform commission: ₹${commissions.totalPlatformCommission}.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
    ])

    return res.json({
      booking: serializeBooking(booking),
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        commissionAmount: payment.commissionAmount,
        workerAmount: payment.workerAmount,
        status: payment.status,
        date: payment.date,
      },
      commission: {
        jobPrice,
        employerCommission: commissions.employerCommissionAmount,
        workerCommission: commissions.workerCommissionAmount,
        totalCommission: commissions.totalPlatformCommission,
        employerPays: commissions.employerPays,
        workerReceives: commissions.workerReceives,
      },
    })
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
        title: 'Work Rejected',
        message: `Your submitted work for ${booking.serviceTitle} needs revision before payment can be released.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
      createNotification({
        userId: booking.employerId,
        type: 'verification_rejected',
        title: 'Verification Rejected',
        message: `You rejected verification for ${booking.serviceTitle}. The worker will revise and resubmit.`,
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

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    const isEmployer = booking.employerId?.toString() === req.user.id || booking.userId?.toString() === req.user.id || booking.providerId?.toString() === req.user.id
    const isWorker = booking.workerId?.toString() === req.user.id
    if (!isEmployer && !isWorker) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking.' })
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a booking that is ${booking.status}.` })
    }

    booking.status = 'cancelled'
    booking.paymentStatus = 'failed'
    await booking.save()

    const cancelledBy = isEmployer ? 'employer' : 'worker'
    const otherPartyId = isEmployer ? booking.workerId : (booking.employerId || booking.userId)

    await Promise.all([
      createNotification({
        userId: otherPartyId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `The booking for ${booking.serviceTitle} has been cancelled by the ${cancelledBy}.`,
        relatedId: booking._id,
        fromUserId: req.user.id,
      }),
      notifyAdmins({
        type: 'booking',
        title: 'Booking Cancelled',
        message: `Booking for ${booking.serviceTitle} was cancelled by ${cancelledBy}.`,
        relatedId: booking._id,
        fromUserId: req.user.id,
      }),
    ])

    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.cancel failed', error)
    next(error)
  }
}

export const requestRefund = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.employerId?.toString() !== req.user.id && booking.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the employer can request a refund.' })
    }

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Refund can only be requested for paid bookings.' })
    }

    if (booking.refundStatus !== 'none') {
      return res.status(400).json({ message: 'A refund request already exists for this booking.' })
    }

    const refundAmount = Number(booking.amount || booking.price || 0)
    booking.refundStatus = 'pending'
    booking.refundAmount = refundAmount
    booking.refundReason = req.body.reason || ''
    await booking.save()

    await Promise.all([
      notifyAdmins({
        type: 'refund',
        title: 'Refund Requested',
        message: `A refund of ₹${refundAmount} has been requested for ${booking.serviceTitle}. Reason: ${req.body.reason || 'Not specified'}.`,
        relatedId: booking._id,
        fromUserId: req.user.id,
      }),
      createNotification({
        userId: req.user.id,
        type: 'refund_requested',
        title: 'Refund Requested',
        message: `Your refund request for ₹${refundAmount} (${booking.serviceTitle}) has been submitted. Admin will review it.`,
        relatedId: booking._id,
      }),
    ])

    return res.json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.requestRefund failed', error)
    next(error)
  }
}

export default {
  listBookings,
  getBookingById,
  createBooking,
  acceptBooking,
  rejectBooking,
  completeBooking,
  verifyBooking,
  rejectVerification,
  cancelBooking,
  requestRefund,
}
