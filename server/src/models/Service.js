import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    price: { type: Number, default: 0, min: 0 },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    providerName: { type: String, default: '' },
    location: { type: String, default: '' },
    status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
)

const Service = mongoose.model('Service', serviceSchema)

export default Service
