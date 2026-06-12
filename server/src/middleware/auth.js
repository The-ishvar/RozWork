import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Authentication required')
    return res.status(401).json({ message: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export const authorizeRole = (roles = []) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  next()
}
