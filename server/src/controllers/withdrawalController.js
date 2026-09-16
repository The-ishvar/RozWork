import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, userId, minAmount, maxAmount } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Withdrawal.countDocuments(filter),
    ]);

    const enriched = await Promise.all(withdrawals.map(async (w) => {
      const user = w.userId ? await User.findById(w.userId).select('name email').lean() : null;
      return {
        id: w._id.toString(),
        userId: w.userId?.toString() || '',
        userName: user?.name || w.userName || 'Unknown',
        userEmail: user?.email || '',
        amount: w.amount,
        method: w.method,
        status: w.status,
        upiId: w.upiId,
        transactionId: w.transactionId,
        createdAt: w.createdAt,
      };
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    const user = withdrawal.userId ? await User.findById(withdrawal.userId).select('name email phone').lean() : null;
    res.json({ success: true, data: { ...withdrawal.toObject(), id: withdrawal._id.toString(), user } });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: { id: withdrawal._id.toString() }, message: 'Withdrawal request created successfully' });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', processedBy: req.user.id, processedAt: new Date() },
      { new: true }
    );
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    res.json({ success: true, data: { id: withdrawal._id.toString(), status: withdrawal.status }, message: 'Withdrawal approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', processedBy: req.user.id, processedAt: new Date(), rejectionReason: reason || '' },
      { new: true }
    );
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    res.json({ success: true, data: { id: withdrawal._id.toString(), status: withdrawal.status }, message: 'Withdrawal rejected successfully' });
  } catch (error) {
    next(error);
  }
};

export const hold = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: 'on_hold', processedBy: req.user.id, processedAt: new Date(), notes: reason || '' },
      { new: true }
    );
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    res.json({ success: true, data: { id: withdrawal._id.toString(), status: withdrawal.status }, message: 'Withdrawal placed on hold' });
  } catch (error) {
    next(error);
  }
};

export const release = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: 'pending', processedBy: req.user.id, processedAt: new Date() },
      { new: true }
    );
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    res.json({ success: true, data: { id: withdrawal._id.toString(), status: withdrawal.status }, message: 'Withdrawal released from hold' });
  } catch (error) {
    next(error);
  }
};
