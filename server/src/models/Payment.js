import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    amount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    workerAmount: { type: Number, default: 0 },
    paymentType: { type: String, enum: ['application_fee', 'booking_fee', 'premium_membership', 'service_payment', 'other'], default: 'other' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    transactionId: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
