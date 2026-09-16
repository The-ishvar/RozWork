import mongoose from 'mongoose'

const advertisementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    link: { type: String, default: '' },
    type: { type: String, enum: ['banner', 'popup', 'home', 'reel', 'sidebar', 'interstitial'], default: 'banner' },
    position: { type: String, default: 'top' },
    targetUrl: { type: String, default: '' },
    status: { type: String, enum: ['active', 'paused', 'scheduled', 'expired', 'draft'], default: 'draft' },
    priority: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sponsorName: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deviceTarget: { type: String, enum: ['all', 'desktop', 'mobile', 'tablet'], default: 'all' },
    regionTarget: { type: [String], default: [] },
  },
  { timestamps: true },
)

const Advertisement = mongoose.models.Advertisement || mongoose.model('Advertisement', advertisementSchema)

export default Advertisement
