import SubscriptionPlan from '../models/SubscriptionPlan.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, type } = req.query;
    const filter = {};

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [plans, total] = await Promise.all([
      SubscriptionPlan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      SubscriptionPlan.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: plans,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, data: plan, message: 'Subscription plan created successfully' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    res.json({ success: true, data: plan, message: 'Subscription plan updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    res.json({ success: true, message: 'Subscription plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};
