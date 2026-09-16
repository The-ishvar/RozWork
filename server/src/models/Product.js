import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    thumbnail: { type: String, default: '' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerName: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'pending', 'rejected', 'sold_out', 'archived'], default: 'pending' },
    featured: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    location: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    commissionPercentage: { type: Number, default: 5 },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    views: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
  },
  { timestamps: true },
)

productSchema.index({ title: 'text', description: 'text', category: 'text' })

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

export default Product
