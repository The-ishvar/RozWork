import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Always load the backend's .env, independent of the directory Node was started from.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true })

export const getMongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI || ''
