import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['booking', 'purchase', 'payment', 'wallet_topup', 'wallet_withdraw', 'commission_employer', 'commission_worker', 'refund'], default: 'purchase' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
    reference: { type: String, default: '' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    description: { type: String, default: '' },
    balanceAfter: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
