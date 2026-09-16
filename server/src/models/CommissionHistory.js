import mongoose from 'mongoose'

const commissionHistorySchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employerName: { type: String, default: '' },
    employerEmail: { type: String, default: '' },
    employerPhone: { type: String, default: '' },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    workerName: { type: String, default: '' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    jobName: { type: String, default: '' },
    jobAmount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    coinsDeducted: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
    completedAt: { type: Date, default: null },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminName: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true },
)

const CommissionHistory = mongoose.models.CommissionHistory || mongoose.model('CommissionHistory', commissionHistorySchema)

export default CommissionHistory
