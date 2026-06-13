import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['booking', 'purchase', 'payment'], default: 'purchase' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    reference: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { timestamps: true },
)

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
