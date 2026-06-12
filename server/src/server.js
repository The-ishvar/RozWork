import dotenv from 'dotenv'
import app from './app.js'

dotenv.config()

const PORT = Number(process.env.PORT) || 5000

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT secret is required - server not usable')
    process.exit(1)
  }

  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Unable to start server', error.message)
    process.exit(1)
  }
}

startServer()
