import mongoose from 'mongoose'

const reelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    userPhoto: { type: String, default: '' },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    category: { type: String, default: 'General' },
    tags: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    status: { type: String, enum: ['active', 'pending', 'hidden', 'deleted', 'reported'], default: 'pending' },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true },
)

reelSchema.index({ title: 'text', description: 'text', tags: 'text' })

const Reel = mongoose.models.Reel || mongoose.model('Reel', reelSchema)

export default Reel
