import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    jobId: { type: String, default: '' },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
    serviceTitle: { type: String, required: true, trim: true },
    serviceProvider: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'waiting_for_verification', 'verification_rejected', 'completed', 'confirmed', 'cancelled'], default: 'pending' },
    verified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    completedAt: { type: Date, default: null },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    note: { type: String, default: '' },
    contactName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    transactionId: { type: String, default: '' },
  },
  { timestamps: true },
)

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
