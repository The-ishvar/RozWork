import Setting from '../models/Setting.js'
import User from '../models/User.js'
import { createNotification } from './notify.js'

const DEFAULT_COIN_SETTINGS = Object.freeze({
  upiId: 'rozwork@paytm',
  qrCodeUrl: '',
  mobileNumber: '9660585691',
  accountHolderName: 'Ishvar Suthar',
  coinRate: 1,
  adminPassword: '9660585691',
  dailyCoinLimit: 0,
  freePostLimit: 3,
  packages: [
    { id: 'starter', label: 'Starter', price: 99, coins: 30 },
    { id: 'growth', label: 'Growth', price: 199, coins: 70 },
    { id: 'business', label: 'Business', price: 499, coins: 200 },
  ],
  usageRules: {
    jobPosts: 20,
    jobPostCoins: 10,
    featuredJobCoins: 10,
    premiumEmployerCoins: 100,
    advertisementCoins: 200,
  },
})

export const buildDefaultCoinPackages = () => DEFAULT_COIN_SETTINGS.packages.map((item) => ({ ...item }))

export const getDefaultCoinSettings = () => ({
  ...DEFAULT_COIN_SETTINGS,
  packages: buildDefaultCoinPackages(),
  usageRules: { ...DEFAULT_COIN_SETTINGS.usageRules },
})

export const loadCoinSettings = async () => {
  const settings = await Setting.find({}).lean()
  const config = Object.fromEntries(settings.map((item) => [item.key, item.value]))

  return {
    ...getDefaultCoinSettings(),
    ...config,
    packages: Array.isArray(config.packages) && config.packages.length ? config.packages : buildDefaultCoinPackages(),
    usageRules: {
      ...getDefaultCoinSettings().usageRules,
      ...(config.usageRules || {}),
    },
  }
}

export const saveCoinSettings = async (updates = {}) => {
  const entries = Object.entries(updates)
  for (const [key, value] of entries) {
    await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true })
  }
  return loadCoinSettings()
}

export const ensureUserWallet = async (userId) => {
  const user = await User.findById(userId)
  if (!user) return null
  if (typeof user.coinBalance === 'undefined') {
    user.coinBalance = 0
  }
  if (typeof user.totalPurchasedCoins === 'undefined') {
    user.totalPurchasedCoins = 0
  }
  if (typeof user.totalUsedCoins === 'undefined') {
    user.totalUsedCoins = 0
  }
  if (typeof user.dailyCoinLimit === 'undefined') {
    user.dailyCoinLimit = 0
  }
  await user.save({ validateBeforeSave: false })
  return user
}

export const addCoinsToUser = async ({ userId, amount, reason = 'Admin adjustment', adminId = null, adminName = 'Admin', reference = null, historyType = 'admin_adjustment' }) => {
  const user = await ensureUserWallet(userId)
  if (!user) return null

  const previousBalance = Number(user.coinBalance || 0)
  const nextBalance = previousBalance + Number(amount)
  const currentAmount = Number(amount)

  user.coinBalance = nextBalance
  user.totalPurchasedCoins = Number(user.totalPurchasedCoins || 0) + currentAmount
  await user.save({ validateBeforeSave: false })

  await createNotification({
    userId,
    type: historyType,
    title: 'Wallet updated',
    message: `Congratulations! आपके Wallet में ${currentAmount} Coins सफलतापूर्वक Add कर दिए गए हैं।`,
    relatedId: user._id,
    fromUserId: adminId,
  })

  return {
    user,
    balance: nextBalance,
    previousBalance,
    added: currentAmount,
    reason,
    adminName,
    reference,
  }
}

export const removeCoinsFromUser = async ({ userId, amount, reason = 'Admin adjustment', adminId = null, adminName = 'Admin', reference = null, historyType = 'admin_adjustment' }) => {
  const user = await ensureUserWallet(userId)
  if (!user) return null

  const previousBalance = Number(user.coinBalance || 0)
  const currentAmount = Number(amount)
  const nextBalance = previousBalance - currentAmount

  if (nextBalance < 0) {
    throw new Error('Insufficient coin balance')
  }

  user.coinBalance = nextBalance
  user.totalUsedCoins = Number(user.totalUsedCoins || 0) + currentAmount
  await user.save({ validateBeforeSave: false })

  await createNotification({
    userId,
    type: historyType,
    title: 'Wallet updated',
    message: `आपके Wallet से ${currentAmount} Coins Remove कर दिए गए हैं.`,
    relatedId: user._id,
    fromUserId: adminId,
  })

  return {
    user,
    balance: nextBalance,
    previousBalance,
    removed: currentAmount,
    reason,
    adminName,
    reference,
  }
}
