import mongoose from 'mongoose'

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/rozwork'
let connectionPromise = null

const resolveMongoUri = () => {
  const configuredUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.MONGO_URL

  if (configuredUri) {
    return configuredUri
  }

  console.warn('MongoDB URI was not found in the environment. Falling back to the local development database.')
  return DEFAULT_MONGO_URI
}

export const getDatabaseStatus = () => ({
  readyState: mongoose.connection.readyState,
  name: mongoose.connection.name,
  host: mongoose.connection.host,
})

export const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true
  }

  try {
    await connectToDatabase()
    return true
  } catch (error) {
    console.error('Database connection unavailable:', error.message)
    return false
  }
}

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected')
    return mongoose.connection
  }

  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = (async () => {
    mongoose.set('bufferCommands', false)
    mongoose.set('strictQuery', false)

    mongoose.connection.removeAllListeners('connected')
    mongoose.connection.removeAllListeners('error')
    mongoose.connection.removeAllListeners('disconnected')

    mongoose.connection.on('connected', () => {
      console.log(`MongoDB connected to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`)
    })

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
    })

    const primaryUri = resolveMongoUri()
    const candidateUris = [primaryUri]

    if (!candidateUris.includes(DEFAULT_MONGO_URI)) {
      candidateUris.push(DEFAULT_MONGO_URI)
    }

    let lastError
    for (const mongoUri of candidateUris) {
      try {
        console.log(`Connecting to MongoDB at ${mongoUri.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@')}`)
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 20000,
          maxPoolSize: 10,
          retryWrites: true,
          w: 'majority',
        })

        console.log(`MongoDB connection established: ${mongoose.connection.host}/${mongoose.connection.name}`)
        return mongoose.connection
      } catch (error) {
        lastError = error
        console.warn(`MongoDB connection failed for ${mongoUri}: ${error.message}`)
      }
    }

    throw lastError || new Error('Unable to connect to MongoDB')
  })()

  try {
    return await connectionPromise
  } catch (error) {
    connectionPromise = null
    throw error
  }
}

export const connectDB = connectToDatabase
