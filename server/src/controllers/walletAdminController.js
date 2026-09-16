import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const getAllWallets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, minBalance, maxBalance } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (minBalance || maxBalance) {
      filter.walletBalance = {};
      if (minBalance) filter.walletBalance.$gte = Number(minBalance);
      if (maxBalance) filter.walletBalance.$lte = Number(maxBalance);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email walletBalance walletPending role')
        .sort({ walletBalance: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, walletBalance: u.walletBalance || 0, walletPending: u.walletPending || 0, role: u.role })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const addMoney = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'wallet_topup',
      amount: Number(amount),
      currency: 'INR',
      status: 'completed',
      description: reason || `Admin added ₹${amount} to wallet`,
      balanceAfter: user.walletBalance,
    });

    res.json({ success: true, data: { walletBalance: user.walletBalance }, message: `₹${amount} added to wallet successfully` });
  } catch (error) {
    next(error);
  }
};

export const removeMoney = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if ((user.walletBalance || 0) < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'wallet_withdraw',
      amount: -Number(amount),
      currency: 'INR',
      status: 'completed',
      description: reason || `Admin deducted ₹${amount} from wallet`,
      balanceAfter: user.walletBalance,
    });

    res.json({ success: true, data: { walletBalance: user.walletBalance }, message: `₹${amount} deducted from wallet successfully` });
  } catch (error) {
    next(error);
  }
};

export const holdBalance = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if ((user.walletBalance || 0) < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    user.walletBalance = (user.walletBalance || 0) - Number(amount);
    user.walletPending = (user.walletPending || 0) + Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'wallet_withdraw',
      amount: -Number(amount),
      currency: 'INR',
      status: 'pending',
      description: reason || `Admin held ₹${amount} from wallet`,
      balanceAfter: user.walletBalance,
    });

    res.json({ success: true, data: { walletBalance: user.walletBalance, walletPending: user.walletPending }, message: `₹${amount} held from wallet successfully` });
  } catch (error) {
    next(error);
  }
};

export const releaseBalance = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if ((user.walletPending || 0) < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient held balance' });
    }

    user.walletPending = (user.walletPending || 0) - Number(amount);
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'wallet_topup',
      amount: Number(amount),
      currency: 'INR',
      status: 'completed',
      description: reason || `Admin released ₹${amount} to wallet`,
      balanceAfter: user.walletBalance,
    });

    res.json({ success: true, data: { walletBalance: user.walletBalance, walletPending: user.walletPending }, message: `₹${amount} released to wallet successfully` });
  } catch (error) {
    next(error);
  }
};

export const getWalletHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).select('name email walletBalance walletPending');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: {
        user: { id: user._id.toString(), name: user.name, email: user.email, walletBalance: user.walletBalance, walletPending: user.walletPending },
        transactions: transactions.map((t) => ({ id: t._id.toString(), type: t.type, amount: t.amount, status: t.status, description: t.description, balanceAfter: t.balanceAfter, createdAt: t.createdAt })),
      },
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};
