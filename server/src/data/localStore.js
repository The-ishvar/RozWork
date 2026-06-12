import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const databaseFilePath = path.join(__dirname, 'database.json')

const createDefaultState = () => ({ users: [] })

let state = createDefaultState()

const loadStateFromDisk = () => {
  if (!fs.existsSync(databaseFilePath)) return null

  try {
    const raw = fs.readFileSync(databaseFilePath, 'utf8')
    if (!raw.trim()) return null

    const parsed = JSON.parse(raw)
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
    }
  } catch (error) {
    console.error('Failed to load database file:', error.message)
    return null
  }
}

const persistState = () => {
  fs.writeFileSync(databaseFilePath, JSON.stringify(state, null, 2))
}

const initializeState = () => {
  const storedState = loadStateFromDisk()
  if (storedState) {
    state = storedState
    return
  }

  persistState()
}

initializeState()

export const createUser = async ({ name, email, password, role = 'user' }) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = {
    id: `user_${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
    data: {},
  }

  state.users.push(user)
  persistState()
  return user
}

export const getUserByEmail = async (email) => {
  const normalized = email?.trim().toLowerCase()
  return state.users.find((user) => user.email?.toLowerCase() === normalized) || null
}

export const getUserByPhone = async (phone) => {
  return state.users.find((user) => user.phone === phone) || null
}

export const getUserByIdentifier = async (identifier) => {
  const normalized = identifier?.trim().toLowerCase()
  return (
    (await getUserByEmail(normalized)) ||
    (await getUserByPhone(identifier?.trim())) ||
    state.users.find((user) => user.username?.toLowerCase() === normalized) ||
    null
  )
}

export const getUserById = (id) => state.users.find((user) => user.id === id) || null

export const updateUser = (id, update) => {
  state.users = state.users.map((user) => (user.id === id ? { ...user, ...update } : user))
  persistState()
  return getUserById(id)
}
