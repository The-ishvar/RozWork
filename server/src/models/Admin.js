import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  },
  { timestamps: true },
)

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false
  }

  const storedPassword = String(this.password)

  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(candidatePassword, storedPassword)
  }

  return storedPassword === String(candidatePassword)
}

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

export default Admin
