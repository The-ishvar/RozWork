import { describe, expect, it } from '@jest/globals'
import User from '../src/models/User.js'

describe('admin login compatibility', () => {
  it('accepts a legacy plaintext password for admin accounts', async () => {
    const user = new User({
      name: 'Legacy Admin',
      email: 'legacy-admin@example.com',
      password: 'legacy-admin-pass',
      role: 'admin',
      username: 'legacyadmin',
      phone: '1234567890',
    })

    const isMatch = await user.comparePassword('legacy-admin-pass')

    expect(isMatch).toBe(true)
    expect(user.password).toBe('legacy-admin-pass')
  })
})
