import Revenue from '../models/Revenue.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, source, startDate, endDate, minAmount, maxAmount } = req.query;
    const filter = {};

    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [revenues, total] = await Promise.all([
      Revenue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Revenue.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: revenues,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueBySource = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });
    pipeline.push(
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } }
    );

    const data = await Revenue.aggregate(pipeline);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRevenueByPeriod = async (req, res, next) => {
  try {
    const { period = 'daily', months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    let dateFormat;
    if (period === 'daily') dateFormat = '%Y-%m-%d';
    else if (period === 'weekly') dateFormat = '%Y-W%V';
    else if (period === 'monthly') dateFormat = '%Y-%m';
    else dateFormat = '%Y-%m-%d';

    const data = await Revenue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [todayRevenue, monthRevenue, yearRevenue, totalRevenue, sourceBreakdown] = await Promise.all([
      Revenue.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Revenue.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Revenue.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Revenue.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Revenue.aggregate([
        {
          $group: {
            _id: '$source',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        today: { total: todayRevenue[0]?.total || 0, count: todayRevenue[0]?.count || 0 },
        thisMonth: { total: monthRevenue[0]?.total || 0, count: monthRevenue[0]?.count || 0 },
        thisYear: { total: yearRevenue[0]?.total || 0, count: yearRevenue[0]?.count || 0 },
        allTime: { total: totalRevenue[0]?.total || 0, count: totalRevenue[0]?.count || 0 },
        bySource: sourceBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
