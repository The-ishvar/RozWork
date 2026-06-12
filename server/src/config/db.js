import mongoose from 'mongoose'

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error('Database connection failed - server not usable')
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })
    console.log('MongoDB connected successfully')
    return mongoose.connection
  } catch (error) {
    console.error('Database connection failed - server not usable')
    throw error
  }
}
