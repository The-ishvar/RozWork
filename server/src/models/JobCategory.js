import mongoose from 'mongoose'

const jobCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    jobCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const JobCategory = mongoose.models.JobCategory || mongoose.model('JobCategory', jobCategorySchema)

export default JobCategory
