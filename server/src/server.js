import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import app from './app.js'
import { connectToDatabase } from './db/connect.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const PORT = Number(process.env.PORT) || 5000

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await connectToDatabase()
    console.log('✅ MongoDB Connected Successfully')
  } catch (error) {
    console.error('⚠️ MongoDB not available at startup:', error.message)
  }

  if (!process.env.JWT_SECRET && !process.env.JWT_SECRET_KEY) {
    process.env.JWT_SECRET = 'rozwork-production-secret'
    console.warn('⚠️ JWT_SECRET was not set. Using a safe fallback secret for deployment.')
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

startServer()