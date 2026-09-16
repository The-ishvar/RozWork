import Reel from '../models/Reel.js';
import User from '../models/User.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, userId } = req.query;
    const filter = {};

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [reels, total] = await Promise.all([
      Reel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Reel.countDocuments(filter),
    ]);

    const enriched = await Promise.all(reels.map(async (r) => {
      const user = r.userId ? await User.findById(r.userId).select('name email').lean() : null;
      return {
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        videoUrl: r.videoUrl,
        category: r.category,
        status: r.status,
        featured: r.featured,
        trending: r.trending,
        likes: r.likes,
        views: r.views,
        comments: r.comments,
        userId: r.userId?.toString() || '',
        userName: user?.name || r.userName || 'Unknown',
        createdAt: r.createdAt,
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
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    const user = reel.userId ? await User.findById(reel.userId).select('name email phone').lean() : null;
    res.json({ success: true, data: { ...reel.toObject(), id: reel._id.toString(), user } });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const reel = await Reel.create(req.body);
    res.status(201).json({ success: true, data: { id: reel._id.toString() }, message: 'Reel created successfully' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, data: { id: reel._id.toString() }, message: 'Reel updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndDelete(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { status: 'active', isApproved: true, approvedAt: new Date(), approvedBy: req.user.id },
      { new: true }
    );
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, data: { id: reel._id.toString(), status: reel.status }, message: 'Reel approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted', isApproved: false, rejectionReason: reason || '' },
      { new: true }
    );
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, data: { id: reel._id.toString(), status: reel.status }, message: 'Reel rejected successfully' });
  } catch (error) {
    next(error);
  }
};

export const hide = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status === 'active' ? 'active' : 'hidden' },
      { new: true }
    );
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, data: { id: reel._id.toString(), status: reel.status }, message: `Reel ${reel.status === 'hidden' ? 'hidden' : 'unhidden'} successfully` });
  } catch (error) {
    next(error);
  }
};

export const feature = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { featured: req.body.featured ?? true },
      { new: true }
    );
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, data: { id: reel._id.toString(), featured: reel.featured }, message: `Reel ${reel.featured ? 'featured' : 'unfeatured'} successfully` });
  } catch (error) {
    next(error);
  }
};

export const trending = async (req, res, next) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { trending: req.body.trending ?? true },
      { new: true }
    );
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    res.json({ success: true, data: { id: reel._id.toString(), trending: reel.trending }, message: `Reel ${reel.trending ? 'set as trending' : 'removed from trending'} successfully` });
  } catch (error) {
    next(error);
  }
};
