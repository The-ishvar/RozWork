import mongoose from 'mongoose'

const walletHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminName: { type: String, default: '' },
    action: { type: String, enum: ['add', 'remove', 'limit_update'], default: 'add' },
    amount: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    previousBalance: { type: Number, default: 0 },
    newBalance: { type: Number, default: 0 },
    dailyCoinLimit: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const WalletHistory = mongoose.models.WalletHistory || mongoose.model('WalletHistory', walletHistorySchema)

export default WalletHistory
