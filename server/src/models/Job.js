import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    location: { type: String, default: '' },
    salary: { type: String, default: '' },
    description: { type: String, default: '' },
    experienceRequired: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    workType: { type: String, default: 'Full Time' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    postedByRole: { type: String, default: 'employer' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'expired'], default: 'approved' },
    goalTags: { type: [String], default: [] },
    applicants: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true },
)

const Job = mongoose.model('Job', jobSchema)

export default Job
