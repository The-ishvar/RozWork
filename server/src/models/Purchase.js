import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerName: { type: String, required: true, trim: true },
    workerProfession: { type: String, default: '' },
    service: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    reference: { type: String, default: '' },
  },
  { timestamps: true },
)

const Purchase = mongoose.model('Purchase', purchaseSchema)

export default Purchase
