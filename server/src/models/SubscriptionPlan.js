import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    duration: { type: Number, required: true, default: 30 },
    durationUnit: { type: String, enum: ['days', 'months', 'years'], default: 'months' },
    features: { type: [String], default: [] },
    maxJobPosts: { type: Number, default: 0 },
    maxProductPosts: { type: Number, default: 0 },
    maxReelUploads: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    color: { type: String, default: '#3B82F6' },
    icon: { type: String, default: 'star' },
    totalSubscribers: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema)

export default SubscriptionPlan
