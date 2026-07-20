import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: undefined, unique: true, sparse: true, trim: true },
    username: { type: String, default: undefined, unique: true, sparse: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['user', 'worker', 'employer', 'admin', 'super_admin'], default: 'user' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    profession: { type: String, default: '' },
    serviceCategories: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    education: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    portfolio: { type: [String], default: [] },
    socialLinks: { type: [String], default: [] },
    companyName: { type: String, default: '' },
    businessDetails: { type: String, default: '' },
    availability: { type: String, default: 'Available now' },
    notificationsEnabled: { type: Boolean, default: true },
    photo: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    walletPending: { type: Number, default: 0 },
    totalCommissionPaid: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    premiumPlan: { type: String, default: '' },
    premiumExpiryDate: { type: Date, default: null },
    isVerified: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false
  }

  const storedPassword = String(this.password)

  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(candidatePassword, storedPassword)
  }

  return storedPassword === String(candidatePassword)
}

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
