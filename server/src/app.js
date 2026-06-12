import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import dataRoutes from './routes/dataRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' })
})

app.use('/auth', authRoutes)
app.use('/api/auth', authRoutes)
app.use('/data', dataRoutes)
app.use('/api/data', dataRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

export default app
