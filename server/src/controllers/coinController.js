import CoinPurchaseRequest from '../models/CoinPurchaseRequest.js'
import CoinTransaction from '../models/CoinTransaction.js'
import WalletHistory from '../models/WalletHistory.js'
import User from '../models/User.js'
import { loadCoinSettings, saveCoinSettings, ensureUserWallet, addCoinsToUser, removeCoinsFromUser } from '../utils/coinSystem.js'
import { createNotification, notifyAdmins } from '../utils/notify.js'

export const getCoinSettings = async (req, res, next) => {
  try {
    const settings = await loadCoinSettings()
    return res.json({ success: true, settings })
  } catch (error) {
    next(error)
  }
}

export const submitCoinPurchaseRequest = async (req, res, next) => {
  try {
    const { packageId, amount, name, email, phone, userId, utrNumber, screenshotUrl, mobileNumberUsed, note } = req.body
    console.info('[coins] submitCoinPurchaseRequest', { userId: req.user?.id, packageId, amount })

    const user = await User.findById(req.user.id)
    if (!user) {
      console.warn('[coins] submitCoinPurchaseRequest: user not found', req.user?.id)
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const settings = await loadCoinSettings()
    const selectedPackage = (settings.packages || []).find((item) => item.id === String(packageId))
    if (!selectedPackage) {
      console.warn('[coins] submitCoinPurchaseRequest: invalid package', { packageId, available: (settings.packages || []).map((p) => p.id) })
      return res.status(400).json({ success: false, message: 'Invalid package selected' })
    }

    const normalizedUtr = String(utrNumber || '').trim()
    const normalizedMobile = String(mobileNumberUsed || '').trim()

    if (!normalizedMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number used for payment is required.' })
    }

    if (!screenshotUrl || !String(screenshotUrl).trim()) {
      return res.status(400).json({ success: false, message: 'Payment screenshot is required.' })
    }

    const requestDoc = await CoinPurchaseRequest.create({
      userId: user._id,
      userName: String(name || user.name || '').trim(),
      userEmail: String(email || user.email || '').trim(),
      userPhone: String(phone || user.phone || '').trim(),
      submittedUserId: String(userId || user._id || '').trim(),
      packageId: selectedPackage.id,
      packageLabel: selectedPackage.label,
      amount: Number(amount || selectedPackage.price),
      coins: selectedPackage.coins,
      utrNumber: normalizedUtr,
      screenshotUrl: String(screenshotUrl || '').trim(),
      mobileNumberUsed: normalizedMobile,
      note: String(note || '').trim(),
      status: 'pending',
    })

    console.info('[coins] submitCoinPurchaseRequest: created', { requestId: requestDoc._id, userId: user._id, packageId: selectedPackage.id })

    await createNotification({
      userId: user._id,
      type: 'coin_purchase_request',
      title: 'Payment Submitted',
      message: `Your payment request for ${selectedPackage.label} (${selectedPackage.coins} coins) has been submitted. Admin will verify it shortly.`,
      relatedId: requestDoc._id,
    })

    await notifyAdmins({
      type: 'coin_purchase_request',
      title: 'New Payment Request',
      message: `${user.name || 'An employer'} submitted a payment request for ${selectedPackage.label} plan (₹${selectedPackage.price} for ${selectedPackage.coins} coins).`,
      relatedId: requestDoc._id,
      fromUserId: user._id,
    })

    return res.json({ success: true, message: 'Request submitted successfully', request: requestDoc })
  } catch (error) {
    console.error('[coins] submitCoinPurchaseRequest failed:', error)
    next(error)
  }
}

export const listCoinPurchaseRequests = async (req, res, next) => {
  try {
    const requests = await CoinPurchaseRequest.find().sort({ createdAt: -1 }).lean()
    console.info('[coins] listCoinPurchaseRequests: returned', { count: requests.length })
    return res.json({ success: true, requests })
  } catch (error) {
    console.error('[coins] listCoinPurchaseRequests failed:', error)
    next(error)
  }
}

export const reviewCoinPurchaseRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params
    const { status, adminNote, adminPassword } = req.body
    const admin = await User.findById(req.user.id)
    const settings = await loadCoinSettings()

    if (String(adminPassword || '') !== String(settings.adminPassword || '')) {
      return res.status(401).json({ success: false, message: 'Admin password is incorrect' })
    }

    const request = await CoinPurchaseRequest.findById(requestId)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.status === 'approved' || request.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed.' })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    request.status = status
    request.adminNote = String(adminNote || '').trim()
    request.reviewedBy = admin._id
    request.reviewedAt = new Date()
    await request.save()

    if (status === 'approved') {
      const result = await addCoinsToUser({
        userId: request.userId,
        amount: request.coins,
        reason: `Manual coin purchase approved for package ${request.packageLabel}`,
        adminId: admin._id,
        adminName: admin.name,
        reference: request._id,
        historyType: 'coin_purchase_approved',
      })

      await CoinTransaction.create({
        userId: request.userId,
        type: 'purchase',
        amount: request.coins,
        balanceAfter: result.balance,
        reason: `Approved manual purchase of ${request.coins} coins`,
        referenceId: request._id,
        referenceType: 'CoinPurchaseRequest',
        status: 'completed',
        adminId: admin._id,
        adminName: admin.name,
      })

      await createNotification({
        userId: request.userId,
        type: 'payment_approved',
        title: 'Payment Approved',
        message: `Your payment has been verified. ${request.coins} coins have been added to your wallet successfully.`,
        relatedId: request._id,
        fromUserId: admin._id,
      })
    } else {
      await CoinTransaction.create({
        userId: request.userId,
        type: 'refund',
        amount: 0,
        balanceAfter: Number((await User.findById(request.userId)).coinBalance || 0),
        reason: `Rejected manual purchase request: ${request.adminNote || 'No reason provided'}`,
        referenceId: request._id,
        referenceType: 'CoinPurchaseRequest',
        status: 'rejected',
        adminId: admin._id,
        adminName: admin.name,
      })

      await createNotification({
        userId: request.userId,
        type: 'payment_rejected',
        title: 'Payment Rejected',
        message: 'Your payment could not be verified. Please contact support.',
        relatedId: request._id,
        fromUserId: admin._id,
      })
    }

    return res.json({ success: true, message: `Request ${status}` })
  } catch (error) {
    next(error)
  }
}

export const getUserCoinWallet = async (req, res, next) => {
  try {
    const user = await ensureUserWallet(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    return res.json({
      success: true,
      wallet: {
        coinBalance: Number(user.coinBalance || 0),
        totalPurchasedCoins: Number(user.totalPurchasedCoins || 0),
        totalUsedCoins: Number(user.totalUsedCoins || 0),
        dailyCoinLimit: Number(user.dailyCoinLimit || 0),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getUserCoinHistory = async (req, res, next) => {
  try {
    const [transactions, requests, history] = await Promise.all([
      CoinTransaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(),
      CoinPurchaseRequest.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(),
      WalletHistory.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean(),
    ])

    return res.json({ success: true, transactions, requests, history })
  } catch (error) {
    next(error)
  }
}

export const adminAdjustCoins = async (req, res, next) => {
  try {
    const { userId, amount, reason, adminPassword, action = 'add' } = req.body
    const admin = await User.findById(req.user.id)
    const settings = await loadCoinSettings()

    if (String(adminPassword || '') !== String(settings.adminPassword || '')) {
      return res.status(401).json({ success: false, message: 'Admin password is incorrect' })
    }

    const targetUser = await ensureUserWallet(userId)
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

    const amountValue = Number(amount || 0)
    if (!amountValue) {
      return res.status(400).json({ success: false, message: 'Amount is required' })
    }

    let result
    if (action === 'remove') {
      result = await removeCoinsFromUser({ userId: targetUser._id, amount: amountValue, reason, adminId: admin._id, adminName: admin.name, historyType: 'admin_remove' })
    } else {
      result = await addCoinsToUser({ userId: targetUser._id, amount: amountValue, reason, adminId: admin._id, adminName: admin.name, historyType: 'admin_add' })
    }

    await CoinTransaction.create({
      userId: targetUser._id,
      type: action === 'remove' ? 'admin_remove' : 'admin_add',
      amount: action === 'remove' ? -amountValue : amountValue,
      balanceAfter: result.balance,
      reason,
      status: 'completed',
      adminId: admin._id,
      adminName: admin.name,
    })

    await WalletHistory.create({
      userId: targetUser._id,
      adminId: admin._id,
      adminName: admin.name,
      action: action === 'remove' ? 'remove' : 'add',
      amount: amountValue,
      reason,
      previousBalance: result.previousBalance,
      newBalance: result.balance,
    })

    return res.json({ success: true, message: action === 'remove' ? 'Coins removed successfully' : 'Coins added successfully', wallet: { coinBalance: result.balance } })
  } catch (error) {
    next(error)
  }
}

export const updateCoinLimit = async (req, res, next) => {
  try {
    const { userId, dailyCoinLimit, adminPassword } = req.body
    const admin = await User.findById(req.user.id)
    const settings = await loadCoinSettings()

    if (String(adminPassword || '') !== String(settings.adminPassword || '')) {
      return res.status(401).json({ success: false, message: 'Admin password is incorrect' })
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

    targetUser.dailyCoinLimit = Number(dailyCoinLimit || 0)
    await targetUser.save({ validateBeforeSave: false })

    await WalletHistory.create({
      userId: targetUser._id,
      adminId: admin._id,
      adminName: admin.name,
      action: 'limit_update',
      amount: 0,
      reason: 'Daily coin limit updated',
      previousBalance: Number(targetUser.coinBalance || 0),
      newBalance: Number(targetUser.coinBalance || 0),
      dailyCoinLimit: targetUser.dailyCoinLimit,
    })

    return res.json({ success: true, message: 'Daily coin limit updated' })
  } catch (error) {
    next(error)
  }
}

export const updateCoinSettings = async (req, res, next) => {
  try {
    const { adminPassword, ...updates } = req.body || {}
    const settings = await loadCoinSettings()

    if (String(adminPassword || '') !== String(settings.adminPassword || '')) {
      return res.status(401).json({ success: false, message: 'Admin password is incorrect' })
    }

    const savedSettings = await saveCoinSettings(updates)
    return res.json({ success: true, message: 'Coin settings saved successfully', settings: savedSettings })
  } catch (error) {
    next(error)
  }
}

export const getWalletHistoryAdmin = async (req, res, next) => {
  try {
    const history = await WalletHistory.find().sort({ createdAt: -1 }).lean()
    return res.json({ success: true, history })
  } catch (error) {
    next(error)
  }
}

export const getEmployerCoinInfo = async (req, res, next) => {
  try {
    const user = await ensureUserWallet(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const settings = await loadCoinSettings()
    const freePostLimit = Number(settings.freePostLimit || 3)
    const jobPostCoins = Number(settings.usageRules?.jobPostCoins || 10)

    return res.json({
      success: true,
      coinBalance: Number(user.coinBalance || 0),
      freePostsUsed: Number(user.freePostsUsed || 0),
      freePostLimit,
      jobPostCoins,
      canPostForFree: Number(user.freePostsUsed || 0) < freePostLimit,
      hasEnoughCoins: Number(user.coinBalance || 0) >= jobPostCoins,
    })
  } catch (error) {
    next(error)
  }
}
