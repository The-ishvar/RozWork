import mongoose from 'mongoose'

const revenueSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: [
        'job_commission',
        'product_commission',
        'premium_membership',
        'featured_job',
        'featured_product',
        'featured_reel',
        'advertisement',
        'recharge',
        'withdrawal_charge',
        'subscription',
        'other',
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedModel: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
    date: { type: Date, default: Date.now },
    month: { type: Number, default: () => new Date().getMonth() },
    year: { type: Number, default: () => new Date().getFullYear() },
  },
  { timestamps: true },
)

revenueSchema.index({ source: 1, date: -1 })
revenueSchema.index({ userId: 1 })

const Revenue = mongoose.models.Revenue || mongoose.model('Revenue', revenueSchema)

export default Revenue
