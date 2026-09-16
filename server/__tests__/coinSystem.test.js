import { describe, expect, it } from '@jest/globals'
import { buildDefaultCoinPackages, getDefaultCoinSettings } from '../src/utils/coinSystem.js'

describe('coin system defaults', () => {
  it('returns the expected manual coin package list', () => {
    const packages = buildDefaultCoinPackages()

    expect(packages).toEqual([
      { id: '50', label: '₹50', price: 50, coins: 50 },
      { id: '100', label: '₹100', price: 100, coins: 100 },
      { id: '200', label: '₹200', price: 200, coins: 200 },
      { id: '500', label: '₹500', price: 500, coins: 500 },
      { id: '1000', label: '₹1000', price: 1000, coins: 1000 },
    ])
  })

  it('includes the Paytm payment and admin password defaults', () => {
    const settings = getDefaultCoinSettings()

    expect(settings.paytmNumber).toBe('9660585691')
    expect(settings.paytmUpiId).toBe('rozwork@paytm')
    expect(settings.paytmQrCodeUrl).toBe('')
    expect(settings.adminPassword).toBe('9660585691')
    expect(settings.coinRate).toBe(1)
  })
})
