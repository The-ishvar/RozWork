import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import Setting from '../models/Setting.js'
import { createNotification, notifyAdmins } from '../utils/notify.js'
import { createRazorpayOrder, verifyRazorpayPayment, getPaymentGatewayStatus } from '../services/paymentService.js'

const defaultPlatformSettings = {
  employerCommission: 10,
  workerCommission: 2,
}

const loadPlatformSettings = async () => {
  const settings = await Setting.find({}).lean()
  return { ...defaultPlatformSettings, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) }
}

export const createOrder = async (req, res, next) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body
    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'bookingId and amount are required.' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    const employerPays = booking.employerPays || Number(amount)
    const receipt = `booking_${booking._id}_${Date.now()}`

    const orderResult = await createRazorpayOrder({
      amount: employerPays,
      receipt,
    })

    if (!orderResult.success) {
      return res.status(500).json({ message: orderResult.message })
    }

    booking.razorpayOrderId = orderResult.orderId
    booking.paymentMethod = paymentMethod || 'razorpay'
    await booking.save()

    return res.json({
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      bookingId: booking._id,
      employerPays,
      commission: {
        jobPrice: booking.amount,
        employerCommission: booking.employerCommissionAmount,
        workerCommission: booking.workerCommissionAmount,
        totalCommission: booking.totalPlatformCommission,
      },
    })
  } catch (error) {
    console.error('payment.createOrder failed', error)
    next(error)
  }
}

export const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body
    if (!bookingId || !razorpayPaymentId) {
      return res.status(400).json({ message: 'bookingId and razorpayPaymentId are required.' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    if (booking.employerId?.toString() !== req.user.id && booking.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the employer can verify payment.' })
    }

    if (razorpayOrderId && razorpaySignature) {
      const isValid = verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
      if (!isValid) {
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' })
      }
    }

    const settings = await loadPlatformSettings()
    const jobPrice = Number(booking.amount || booking.price || 0)
    const employerCommissionPct = Number(settings.employerCommission ?? 10)
    const workerCommissionPct = Number(settings.workerCommission ?? 2)
    const employerCommissionAmount = Number(((jobPrice * employerCommissionPct) / 100).toFixed(2))
    const workerCommissionAmount = Number(((jobPrice * workerCommissionPct) / 100).toFixed(2))
    const totalPlatformCommission = Number((employerCommissionAmount + workerCommissionAmount).toFixed(2))
    const employerPays = Number((jobPrice + employerCommissionAmount).toFixed(2))
    const workerReceives = Number((jobPrice - workerCommissionAmount).toFixed(2))

    booking.razorpayOrderId = razorpayOrderId || ''
    booking.razorpayPaymentId = razorpayPaymentId || ''
    booking.razorpaySignature = razorpaySignature || ''
    booking.paymentMethod = paymentMethod || 'razorpay'
    booking.paymentStatus = 'paid'
    booking.status = 'accepted'
    await booking.save()

    const payment = await Payment.create({
      userId: booking.employerId || booking.userId,
      workerId: booking.workerId,
      employerId: booking.employerId || booking.userId,
      bookingId: booking._id,
      amount: jobPrice,
      totalAmount: employerPays,
      commissionAmount: totalPlatformCommission,
      employerCommission: employerCommissionAmount,
      workerCommission: workerCommissionAmount,
      workerAmount: workerReceives,
      paymentType: 'service_payment',
      status: 'completed',
      transactionId: razorpayPaymentId || `payment_${Date.now()}`,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      paymentMethod: paymentMethod || 'razorpay',
      date: new Date(),
    })

    const employer = await User.findById(booking.employerId || booking.userId)
    if (employer) {
      await Transaction.create({
        userId: employer._id,
        type: 'payment',
        amount: employerPays,
        currency: 'INR',
        status: 'completed',
        reference: payment._id.toString(),
        bookingId: booking._id,
        paymentId: payment._id,
        description: `Payment for ${booking.serviceTitle}`,
      })
    }

    await Promise.all([
      createNotification({
        userId: booking.workerId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment of ₹${employerPays} has been received for ${booking.serviceTitle}. You will receive ₹${workerReceives} after work completion.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
      notifyAdmins({
        type: 'payment',
        title: 'Payment Successful',
        message: `Payment of ₹${employerPays} received for ${booking.serviceTitle}. Commission: ₹${totalPlatformCommission}.`,
        relatedId: booking._id,
        fromUserId: booking.employerId,
      }),
    ])

    return res.json({
      message: 'Payment verified successfully',
      booking: {
        id: booking._id.toString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
      },
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        commissionAmount: payment.commissionAmount,
        workerAmount: payment.workerAmount,
        status: payment.status,
      },
    })
  } catch (error) {
    console.error('payment.verifyPayment failed', error)
    next(error)
  }
}

export const getPaymentStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).lean()
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    return res.json({
      bookingId: booking._id.toString(),
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod || '',
      amount: booking.amount,
      employerPays: booking.employerPays || 0,
      workerReceives: booking.workerReceives || 0,
      totalPlatformCommission: booking.totalPlatformCommission || 0,
      refundStatus: booking.refundStatus || 'none',
      refundAmount: booking.refundAmount || 0,
    })
  } catch (error) {
    console.error('payment.getPaymentStatus failed', error)
    next(error)
  }
}

export const getPaymentMethods = async (_req, res, next) => {
  try {
    const gatewayStatus = await getPaymentGatewayStatus()
    const methods = []
    if (gatewayStatus.razorpay.enabled) methods.push({ id: 'razorpay', name: 'Razorpay (Card / Netbanking / Wallet)', enabled: true, configured: gatewayStatus.razorpay.configured })
    if (gatewayStatus.upi.enabled) methods.push({ id: 'upi', name: 'UPI', enabled: true })
    if (gatewayStatus.phonepe.enabled) methods.push({ id: 'phonepe', name: 'PhonePe', enabled: true })
    if (gatewayStatus.gpay.enabled) methods.push({ id: 'gpay', name: 'Google Pay', enabled: true })
    if (gatewayStatus.paytm.enabled) methods.push({ id: 'paytm', name: 'Paytm', enabled: true })
    return res.json({ methods, gateway: gatewayStatus })
  } catch (error) {
    console.error('payment.getPaymentMethods failed', error)
    next(error)
  }
}

export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      $or: [{ userId: req.user.id }, { workerId: req.user.id }, { employerId: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .lean()

    return res.json({
      payments: payments.map((p) => ({
        id: p._id.toString(),
        amount: p.amount,
        totalAmount: p.totalAmount,
        commissionAmount: p.commissionAmount,
        workerAmount: p.workerAmount,
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod || '',
        status: p.status,
        transactionId: p.transactionId,
        refundStatus: p.refundStatus || 'none',
        refundAmount: p.refundAmount || 0,
        date: p.date || p.createdAt,
        createdAt: p.createdAt,
      })),
    })
  } catch (error) {
    console.error('payment.getMyPayments failed', error)
    next(error)
  }
}

export default {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  getPaymentMethods,
  getMyPayments,
}
