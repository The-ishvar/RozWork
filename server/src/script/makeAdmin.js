import '../config/env.js'
import bcrypt from 'bcryptjs'

import User from '../models/User.js'
import Admin from '../models/Admin.js'
import { connectToDatabase } from '../db/connect.js'

const getArg = (name, defaultValue) => {
  const flag = `--${name}`
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return defaultValue
  const value = process.argv[idx + 1]
  return value === undefined ? defaultValue : value
}

const getBooleanArg = (name, defaultValue = false) => {
  const flag = `--${name}`
  return process.argv.includes(flag) ? true : defaultValue
}

const validRoles = ['admin', 'super_admin']

export const resolveAdminBootstrapConfig = (overrides = {}) => {
  const env = process.env
  const role = String(overrides.role ?? env.ADMIN_ROLE ?? getArg('role', 'admin')).trim().toLowerCase()
  const name = String(overrides.name ?? env.ADMIN_NAME ?? getArg('name', 'Admin Name')).trim()
  const email = String(overrides.email ?? env.ADMIN_EMAIL ?? getArg('email', 'is1034016@gmail.com')).trim().toLowerCase()
  const phone = String(overrides.phone ?? env.ADMIN_PHONE ?? getArg('phone', '9660585691')).trim()
  const username = String(overrides.username ?? env.ADMIN_USERNAME ?? getArg('username', 'admin')).trim()
  const password = String(overrides.password ?? env.ADMIN_PASSWORD ?? getArg('password', '9660585691ms')).trim()
  const dryRun = overrides.dryRun ?? getBooleanArg('dry-run')
  const debugVerify = overrides.debugVerify ?? getBooleanArg('debug-verify')

  return {
    role: validRoles.includes(role) ? role : 'admin',
    name,
    email,
    phone,
    username,
    password,
    dryRun,
    debugVerify,
  }
}

export const ensureAdminAccount = async (overrides = {}) => {
  const config = resolveAdminBootstrapConfig(overrides)

  if (!config.email || !config.password || !config.name) {
    console.log('No admin bootstrap values supplied; skipping admin account creation.')
    return null
  }

  const normalizedEmail = String(config.email).trim().toLowerCase()
  const normalizedPhone = String(config.phone || '').trim()
  const normalizedUsername = String(config.username || '').trim() || normalizedEmail.split('@')[0]

  await connectToDatabase()

  let hashedPassword
  if (config.password) {
    hashedPassword = await bcrypt.hash(String(config.password), 10)
  }

  const admin = await Admin.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: String(config.name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        username: normalizedUsername,
        role: config.role,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    },
    { upsert: true, new: true, runValidators: true, returnDocument: 'after' },
  )

  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: String(config.name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        username: normalizedUsername,
        role: config.role,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    },
    { upsert: true, new: true, runValidators: true, returnDocument: 'after' },
  )

  return { admin, user }
}

const run = async () => {
  const config = resolveAdminBootstrapConfig()

  console.log('== makeAdmin.js ==')
  console.log(`role: ${config.role}`)
  console.log(`name: ${config.name}`)
  console.log(`email: ${config.email}`)
  console.log(`phone: ${config.phone}`)
  console.log(`username: ${config.username || '(auto/default by User model usage)'}`)
  console.log(`dry-run: ${config.dryRun ? 'yes' : 'no'}`)
  console.log(`debug-verify: ${config.debugVerify ? 'yes' : 'no'}`)

  if (config.dryRun) {
    console.log('Dry-run enabled. Exiting without DB changes.')
    return
  }

  if (!config.email || !config.password || !config.name) {
    console.error('Missing required arguments. Usage:')
    console.error('  node makeAdmin.js --name "Admin Name" --email admin@example.com --password <password> [--role admin|super_admin] [--phone <phone>]')
    process.exit(1)
  }

  const result = await ensureAdminAccount(config)
  if (!result) {
    return
  }

  console.log('\n✅ Admin created/updated successfully')
  console.log(`Admin _id: ${result.admin._id.toString()}`)
  console.log(`User _id:  ${result.user._id.toString()}`)

  if (config.debugVerify && config.password) {
    const userFresh = await User.findOne({ email: config.email }).select('+password').exec()
    if (!userFresh) {
      console.error('❌ debug-verify: Could not re-load User by email to verify password.')
    } else if (typeof userFresh.comparePassword !== 'function') {
      console.error('❌ debug-verify: User.comparePassword is not available.')
    } else {
      const compareResult = await userFresh.comparePassword(String(config.password))
      console.log(`🔎 debug-verify: password match = ${compareResult}`)
      console.log(`🔎 debug-verify: stored role = ${userFresh.role}`)
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('makeAdmin.js')) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ makeAdmin.js failed:', err)
      process.exit(1)
    })
}
