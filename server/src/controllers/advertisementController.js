import Advertisement from '../models/Advertisement.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, type } = req.query;
    const filter = {};

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [advertisements, total] = await Promise.all([
      Advertisement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name email'),
      Advertisement.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: advertisements,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id).populate('createdBy', 'name email');
    if (!advertisement) return res.status(404).json({ success: false, message: 'Advertisement not found' });
    res.json({ success: true, data: advertisement });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: advertisement, message: 'Advertisement created successfully' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!advertisement) return res.status(404).json({ success: false, message: 'Advertisement not found' });
    res.json({ success: true, data: advertisement, message: 'Advertisement updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!advertisement) return res.status(404).json({ success: false, message: 'Advertisement not found' });
    res.json({ success: true, message: 'Advertisement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const activate = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { status: 'active', activatedAt: new Date() },
      { new: true }
    );
    if (!advertisement) return res.status(404).json({ success: false, message: 'Advertisement not found' });
    res.json({ success: true, data: advertisement, message: 'Advertisement activated successfully' });
  } catch (error) {
    next(error);
  }
};

export const pause = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { status: 'paused', pausedAt: new Date() },
      { new: true }
    );
    if (!advertisement) return res.status(404).json({ success: false, message: 'Advertisement not found' });
    res.json({ success: true, data: advertisement, message: 'Advertisement paused successfully' });
  } catch (error) {
    next(error);
  }
};
