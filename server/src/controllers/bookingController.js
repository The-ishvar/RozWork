import Booking from '../models/Booking.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { notifyAdmins } from '../utils/notify.js'

const serializeBooking = (booking) => ({
  id: booking._id ? booking._id.toString() : booking.id,
  userId: booking.userId ? booking.userId.toString() : '',
  providerId: booking.providerId ? booking.providerId.toString() : null,
  serviceId: booking.serviceId ? booking.serviceId.toString() : null,
  serviceTitle: booking.serviceTitle,
  serviceProvider: booking.serviceProvider,
  amount: booking.amount,
  currency: booking.currency,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  note: booking.note,
  contactName: booking.contactName,
  contactEmail: booking.contactEmail,
  contactPhone: booking.contactPhone,
  transactionId: booking.transactionId,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
})

export const listBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
    return res.json({ bookings: bookings.map(serializeBooking) })
  } catch (error) {
    console.error('bookings.list failed', error)
    next(error)
  }
}

export const createBooking = async (req, res, next) => {
  try {
    const booking = await Booking.create({
      userId: req.user.id,
      providerId: req.body.providerId || null,
      serviceId: req.body.serviceId || null,
      serviceTitle: req.body.serviceTitle || req.body.service || 'Service',
      serviceProvider: req.body.serviceProvider || '',
      amount: Number(req.body.amount || 0),
      note: req.body.note || '',
      contactName: req.body.contactName || req.user.name,
      contactEmail: req.body.contactEmail || req.user.email,
      contactPhone: req.body.contactPhone || req.user.phone || '',
      transactionId: req.body.transactionId || `booking_${Date.now()}`,
      status: req.body.status || 'confirmed',
      paymentStatus: req.body.paymentStatus || 'paid',
    })

    await notifyAdmins({
      type: 'booking',
      title: 'New booking received',
      message: `${req.user.name || 'A user'} booked ${booking.serviceTitle || 'a service'}.`,
      relatedId: booking._id,
      fromUserId: req.user.id,
    })

    return res.status(201).json({ booking: serializeBooking(booking) })
  } catch (error) {
    console.error('bookings.create failed', error)
    next(error)
  }
}

export default { listBookings, createBooking }
