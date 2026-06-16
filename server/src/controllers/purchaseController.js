import Purchase from '../models/Purchase.js'
import Booking from '../models/Booking.js'
import Transaction from '../models/Transaction.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import Payment from '../models/Payment.js'
import Setting from '../models/Setting.js'
import { notifyAdmins } from '../utils/notify.js'
import { emitPlatformEvent } from '../utils/events.js'

const defaultPlatformSettings = {
  premiumPrice: 99,
}

const loadPlatformSettings = async () => {
  const settings = await Setting.find({}).lean()
  return { ...defaultPlatformSettings, ...Object.fromEntries(settings.map((item) => [item.key, item.value])) }
}

const serializePurchase = (purchase) => ({
  id: purchase._id ? purchase._id.toString() : purchase.id,
  workerName: purchase.workerName,
  workerProfession: purchase.workerProfession,
  service: purchase.service,
  amount: purchase.amount,
  currency: purchase.currency,
  status: purchase.status,
  bookingId: purchase.bookingId ? purchase.bookingId.toString() : null,
  reference: purchase.reference,
  createdAt: purchase.createdAt,
  updatedAt: purchase.updatedAt,
})

export const listPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
    return res.json({ purchases: purchases.map(serializePurchase) })
  } catch (error) {
    console.error('purchases.list failed', error)
    next(error)
  }
}

export const createPurchase = async (req, res, next) => {
  try {
    const { workerName, workerProfession = '', amount, service = '', providerId = null, note = '', reference = '' } = req.body

    if (!workerName || !amount) {
      return res.status(400).json({ message: 'Worker name and amount are required' })
    }

    const booking = await Booking.create({
      userId: req.user.id,
      providerId,
      serviceTitle: service || workerProfession || workerName,
      serviceProvider: workerName,
      amount: Number(amount),
      note,
      contactName: req.user.name,
      contactEmail: req.user.email,
      contactPhone: req.user.phone || '',
      transactionId: reference || `booking_${Date.now()}`,
      status: 'confirmed',
      paymentStatus: 'paid',
    })

    const purchase = await Purchase.create({
      userId: req.user.id,
      workerName,
      workerProfession,
      service,
      amount: Number(amount),
      currency: req.body.currency || 'INR',
      status: 'completed',
      bookingId: booking._id,
      reference: reference || booking.transactionId,
    })

    await Transaction.create({
      userId: req.user.id,
      type: 'purchase',
      amount: Number(amount),
      currency: req.body.currency || 'INR',
      status: 'completed',
      reference: purchase.reference,
      description: `Booking for ${service || workerName}`,
    })

    await notifyAdmins({
      type: 'booking',
      title: 'New booking',
      message: `${req.user.name} booked ${service || workerName}.`,
      relatedId: booking._id,
      fromUserId: req.user.id,
    })

    if (providerId) {
      await Notification.create({
        userId: providerId,
        fromUserId: req.user.id,
        type: 'booking',
        title: 'New booking request',
        message: `${req.user.name} booked your service ${service || workerName}.`,
        relatedId: booking._id,
      })
    }

    return res.status(201).json({
      message: 'Booking completed successfully',
      purchase: serializePurchase(purchase),
      booking,
      transaction: { reference: purchase.reference, amount: Number(amount) },
      user: { purchases: [serializePurchase(purchase)] },
    })
  } catch (error) {
    console.error('purchases.create failed', error)
    next(error)
  }
}

export const purchasePremiumMembership = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const settings = await loadPlatformSettings()
    const premiumAmount = Number(settings.premiumPrice ?? 99)
    const premiumTransactionId = `premium_${Date.now()}`
    const payment = await Payment.create({
      userId: user._id,
      amount: premiumAmount,
      paymentType: 'premium_membership',
      status: 'completed',
      transactionId: premiumTransactionId,
    })

    const premiumExpiryDate = new Date()
    premiumExpiryDate.setMonth(premiumExpiryDate.getMonth() + 1)

    user.isPremium = true
    user.premiumPlan = 'monthly'
    user.premiumExpiryDate = premiumExpiryDate
    await user.save()

    const purchase = await Purchase.create({
      userId: user._id,
      workerName: 'Premium Membership',
      workerProfession: 'Platform Access',
      service: 'Premium Membership',
      amount: premiumAmount,
      currency: 'INR',
      status: 'completed',
      reference: premiumTransactionId,
    })

    await Transaction.create({
      userId: user._id,
      type: 'purchase',
      amount: premiumAmount,
      currency: 'INR',
      status: 'completed',
      reference: premiumTransactionId,
      description: 'Premium membership activation',
    })

    await notifyAdmins({
      type: 'premium',
      title: 'Premium membership activated',
      message: `${user.name} activated a premium plan.`,
      relatedId: user._id,
      fromUserId: user._id,
    })

    emitPlatformEvent('premium.purchased', {
      userId: user._id.toString(),
      amount: premiumAmount,
      paymentType: payment.paymentType,
    })

    return res.status(201).json({
      message: 'Premium membership activated',
      purchase: serializePurchase(purchase),
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
        status: payment.status,
        transactionId: payment.transactionId,
      },
      user: {
        id: user._id.toString(),
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiryDate: user.premiumExpiryDate,
      },
    })
  } catch (error) {
    console.error('purchases.premium failed', error)
    next(error)
  }
}

export const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' })
    }

    const purchases = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
    return res.json({ message: 'Purchase removed successfully', purchases: purchases.map(serializePurchase) })
  } catch (error) {
    console.error('purchases.delete failed', error)
    next(error)
  }
}

export default { listPurchases, createPurchase, purchasePremiumMembership, deletePurchase }
