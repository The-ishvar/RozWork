import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import app from './app.js'
import { connectToDatabase } from './db/connect.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const PORT = Number(process.env.PORT) || 5000

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://roz-work.vercel.app',
        'https://www.roz-work.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
      ]
      if (!origin || allowedOrigins.includes(origin) || /vercel\.app$/i.test(origin) || /localhost/i.test(origin)) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    credentials: true,
    transports: ['websocket', 'polling'],
  },
})

const onlineUsers = new Map()

io.on('connection', (socket) => {
  console.log('[socket] User connected:', socket.id)

  socket.on('user:online', ({ userId }) => {
    onlineUsers.set(userId, socket.id)
    socket.userId = userId
    io.emit('users:online', Array.from(onlineUsers.keys()))
  })

  socket.on('message:send', (data) => {
    const { conversationId, senderId, content, type } = data
    const message = {
      _id: Date.now().toString(),
      conversationId,
      senderId,
      content,
      type: type || 'text',
      seen: false,
      createdAt: new Date().toISOString(),
    }

    io.emit('message:new', message)
  })

  socket.on('typing:start', ({ userId, conversationId }) => {
    socket.broadcast.emit('typing:start', { userId, conversationId })
  })

  socket.on('typing:stop', ({ conversationId }) => {
    socket.broadcast.emit('typing:stop', { conversationId })
  })

  socket.on('message:seen', ({ conversationId, messageIds, userId }) => {
    io.emit('message:seen', { messageIds, conversationId })
  })

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId)
      io.emit('users:online', Array.from(onlineUsers.keys()))
    }
    console.log('[socket] User disconnected:', socket.id)
  })
})

export { io }

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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

startServer()
