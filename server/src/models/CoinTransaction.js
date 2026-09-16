import mongoose from 'mongoose'

const coinTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['purchase', 'usage', 'admin_add', 'admin_remove', 'refund'], default: 'purchase' },
    amount: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'rejected'], default: 'completed' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminName: { type: String, default: '' },
  },
  { timestamps: true },
)

const CoinTransaction = mongoose.models.CoinTransaction || mongoose.model('CoinTransaction', coinTransactionSchema)

export default CoinTransaction
