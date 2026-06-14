import mongoose from 'mongoose'

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Featured' },
    imageUrl: { type: String, required: true, trim: true },
    imageAlt: { type: String, default: '' },
    location: { type: String, default: '' },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, default: '' },
  },
  { timestamps: true },
)

const GalleryItem = mongoose.models.GalleryItem || mongoose.model('GalleryItem', galleryItemSchema)

export default GalleryItem
