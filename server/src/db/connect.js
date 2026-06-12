import mongoose from 'mongoose'

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGODB_URL

  if (!uri) {
    console.warn('MongoDB URI is not configured. Continuing without a database connection.')
    return false
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
    console.log('MongoDB connected successfully')
    return true
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}). Continuing without a database connection.`)
    return false
  }
}
