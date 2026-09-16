import mongoose from 'mongoose'

const coinPurchaseRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    userPhone: { type: String, default: '' },
    submittedUserId: { type: String, default: '' },
    packageId: { type: String, default: '' },
    packageLabel: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    utrNumber: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    mobileNumberUsed: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

const CoinPurchaseRequest = mongoose.models.CoinPurchaseRequest || mongoose.model('CoinPurchaseRequest', coinPurchaseRequestSchema)

export default CoinPurchaseRequest
