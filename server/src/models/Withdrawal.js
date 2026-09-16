import mongoose from 'mongoose'

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['upi', 'bank_transfer', 'razorpay', 'phonepe', 'paytm'], default: 'upi' },
    upiId: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'processing', 'approved', 'rejected', 'completed', 'on_hold'], default: 'pending' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    notes: { type: String, default: '' },
    commission: { type: Number, default: 0 },
    commissionPercentage: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema)

export default Withdrawal
