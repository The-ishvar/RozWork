import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

import User from '../models/User.js'
import Admin from '../models/Admin.js'
import { connectToDatabase } from '../db/connect.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

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

const role = getArg('role', 'super_admin')
const name = getArg('name', role === 'super_admin' ? 'Super Admin' : 'Admin')
const email = getArg('email', role === 'super_admin' ? 'superadmin@rozwork.com' : 'admin@rozwork.com')
const phone = getArg('phone', role === 'super_admin' ? '9660585691' : '')
const username = getArg('username', '')
const password = getArg('password', role === 'super_admin' ? '123456789' : '123456789')
const dryRun = getBooleanArg('dry-run')
const debugVerify = getBooleanArg('debug-verify')

const validRoles = ['admin', 'super_admin']
if (!validRoles.includes(role)) {
  console.error(`Invalid --role "${role}". Use one of: ${validRoles.join(', ')}`)
  process.exit(1)
}

const run = async () => {
  console.log('== makeAdmin.js ==')
  console.log(`role: ${role}`)
  console.log(`name: ${name}`)
  console.log(`email: ${email}`)
  console.log(`phone: ${phone}`)
  console.log(`username: ${username || '(auto/default by User model usage)'}`)
  console.log(`dry-run: ${dryRun ? 'yes' : 'no'}`)
  console.log(`debug-verify: ${debugVerify ? 'yes' : 'no'}`)

  if (dryRun) {
    console.log('Dry-run enabled. Exiting without DB changes.')
    return
  }

  await connectToDatabase()

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedPhone = String(phone || '').trim()

  let hashedPassword
  if (password) {
    hashedPassword = await bcrypt.hash(String(password), 10)
  }

  // 1) Create/Update Admin (new schema)
  const admin = await Admin.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        username: String(username).trim() || normalizedEmail.split('@')[0],
        role,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    },
    { upsert: true, new: true, runValidators: true },
  )

  // 2) Create/Update User (existing auth uses User.role in JWT)
  //    IMPORTANT: use hashed password because findOneAndUpdate bypasses pre('save').
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        username: String(username).trim() || normalizedEmail.split('@')[0],
        role,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
    },
    { upsert: true, new: true, runValidators: true },
  )

  console.log('\n✅ Admin created/updated successfully')
  console.log(`Admin _id: ${admin._id.toString()}`)
  console.log(`User _id:  ${user._id.toString()}`)

  if (debugVerify && password) {
    // Verify the stored password hash matches the plain password we provided
    const userFresh = await User.findOne({ email: normalizedEmail }).select('+password').exec()
    if (!userFresh) {
      console.error('❌ debug-verify: Could not re-load User by email to verify password.')
    } else if (typeof userFresh.comparePassword !== 'function') {
      console.error('❌ debug-verify: User.comparePassword is not available.')
    } else {
      const compareResult = await userFresh.comparePassword(String(password))
      console.log(`🔎 debug-verify: password match = ${compareResult}`)
      console.log(`🔎 debug-verify: stored role = ${userFresh.role}`)
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ makeAdmin.js failed:', err)
    process.exit(1)
  })
