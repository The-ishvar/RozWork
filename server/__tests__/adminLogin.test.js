import { describe, expect, it } from '@jest/globals'
import User from '../src/models/User.js'
import { resolveAdminBootstrapConfig } from '../src/script/makeAdmin.js'

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

  it('resolves the bootstrap admin config from explicit overrides', () => {
    const config = resolveAdminBootstrapConfig({
      name: 'Admin Name',
      email: 'is1034016@gmail.com',
      password: '9660585691ms',
      role: 'admin',
      phone: '9660585691',
      username: 'admin',
    })

    expect(config).toMatchObject({
      name: 'Admin Name',
      email: 'is1034016@gmail.com',
      password: '9660585691ms',
      role: 'admin',
      phone: '9660585691',
      username: 'admin',
    })
  })
})
