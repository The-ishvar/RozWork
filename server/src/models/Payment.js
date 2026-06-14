import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
