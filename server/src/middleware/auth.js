import jwt from 'jsonwebtoken'

const getJwtSecret = () => process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'rozwork-dev-secret'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'TOKEN_REQUIRED' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, getJwtSecret())
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'INVALID_TOKEN' })
  }
}

export const authorizeRole = (roles = []) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' })
  }

  return next()
}
