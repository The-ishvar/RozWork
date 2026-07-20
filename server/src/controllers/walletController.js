import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import { createNotification } from '../utils/notify.js'

export const getWalletBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance walletPending earnings totalCommissionPaid totalSpent').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.json({
      walletBalance: user.walletBalance || 0,
      walletPending: user.walletPending || 0,
      earnings: user.earnings || 0,
      totalCommissionPaid: user.totalCommissionPaid || 0,
      totalSpent: user.totalSpent || 0,
    })
  } catch (error) {
    console.error('wallet.getBalance failed', error)
    next(error)
  }
}

export const getWalletTransactions = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query
    const query = { userId: req.user.id }
    if (type) query.type = type

    const total = await Transaction.countDocuments(query)
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean()

    return res.json({
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        reference: t.reference,
        description: t.description,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    console.error('wallet.getTransactions failed', error)
    next(error)
  }
}

export const topUpWallet = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body
    const topUpAmount = Number(amount)
    if (!topUpAmount || topUpAmount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid amount.' })
    }
    if (topUpAmount < 10) {
      return res.status(400).json({ message: 'Minimum top-up amount is ₹10.' })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.walletBalance = Number(user.walletBalance || 0) + topUpAmount
    await user.save()

    const transaction = await Transaction.create({
      userId: user._id,
      type: 'wallet_topup',
      amount: topUpAmount,
      currency: 'INR',
      status: 'completed',
      description: `Wallet top-up of ₹${topUpAmount} via ${paymentMethod || 'UPI'}`,
      balanceAfter: user.walletBalance,
    })

    await createNotification({
      userId: user._id,
      type: 'wallet_topup',
      title: 'Wallet Top-Up Successful',
      message: `₹${topUpAmount} has been added to your wallet. New balance: ₹${user.walletBalance}.`,
      relatedId: transaction._id,
    })

    return res.json({
      message: 'Wallet top-up successful',
      walletBalance: user.walletBalance,
      transaction: {
        id: transaction._id.toString(),
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error('wallet.topUp failed', error)
    next(error)
  }
}

export const withdrawFromWallet = async (req, res, next) => {
  try {
    const { amount, upiId, bankDetails } = req.body
    const withdrawAmount = Number(amount)
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid amount.' })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (Number(user.walletBalance || 0) < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' })
    }

    if (withdrawAmount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹100.' })
    }

    user.walletBalance = Number(user.walletBalance || 0) - withdrawAmount
    user.walletPending = Number(user.walletPending || 0) + withdrawAmount
    await user.save()

    const transaction = await Transaction.create({
      userId: user._id,
      type: 'wallet_withdraw',
      amount: withdrawAmount,
      currency: 'INR',
      status: 'pending',
      description: `Withdrawal request of ₹${withdrawAmount} to ${upiId || 'bank account'}`,
      balanceAfter: user.walletBalance,
    })

    await createNotification({
      userId: user._id,
      type: 'withdrawal_requested',
      title: 'Withdrawal Requested',
      message: `Your withdrawal request of ₹${withdrawAmount} has been submitted. It will be processed within 2-3 business days.`,
      relatedId: transaction._id,
    })

    return res.json({
      message: 'Withdrawal request submitted',
      walletBalance: user.walletBalance,
      walletPending: user.walletPending,
      transaction: {
        id: transaction._id.toString(),
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error('wallet.withdraw failed', error)
    next(error)
  }
}

export default {
  getWalletBalance,
  getWalletTransactions,
  topUpWallet,
  withdrawFromWallet,
}
