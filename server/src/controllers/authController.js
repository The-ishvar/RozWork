import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createUser, getUserByEmail, getUserByIdentifier, getUserById } from '../data/localStore.js'

const createToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

export const register = async (req, res) => {
  const { name, email, password, role = 'user' } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' })
  }

  const user = await createUser({ name, email, password, role })
  const token = createToken(user)

  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}

export const login = async (req, res) => {
  const { identifier, email, password } = req.body
  const loginIdentifier = identifier || email

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await getUserByIdentifier(loginIdentifier)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = createToken(user)
  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}

export const me = async (req, res) => {
  const user = await getUserById(req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
}
