import User from '../models/User.js';
import Product from '../models/Product.js';
import Booking from '../models/Booking.js';
import Job from '../models/Job.js';
import Revenue from '../models/Revenue.js';

export const getDailyRevenue = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const revenue = await Revenue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyRevenue = async (req, res, next) => {
  try {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const revenue = await Revenue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
};

export const getRevenueBySource = async (_req, res, next) => {
  try {
    const revenue = await Revenue.aggregate([
      { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
};

export const getTopWorkers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const workers = await User.find({ role: 'worker' })
      .sort({ ratings: -1, completedJobs: -1 })
      .limit(Number(limit))
      .select('name email ratings completedJobs earnings location profession photo');
    res.json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
};

export const getTopEmployers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const employers = await User.find({ role: 'employer' })
      .sort({ totalSpent: -1 })
      .limit(Number(limit))
      .select('name email totalSpent companyName location photo');
    res.json({ success: true, data: employers });
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const products = await Product.find({ status: 'active' })
      .sort({ sold: -1, ratings: -1 })
      .limit(Number(limit))
      .select('title price sold ratings category sellerName');
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const getTopCategories = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const categories = await Job.aggregate([
      { $group: { _id: '$category', totalJobs: { $sum: 1 } } },
      { $sort: { totalJobs: -1 } },
      { $limit: Number(limit) },
    ]);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getMostActiveUsers = async (req, res, next) => {
  try {
    const { limit = 10, role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .sort({ lastActiveAt: -1 })
      .limit(Number(limit))
      .select('name email role lastActiveAt completedJobs earnings');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const [dailyUsers, dailyEarnings, dailyJobs, dailyBookings, dailyProducts] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Revenue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      Job.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Product.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: { dailyUsers, dailyEarnings, dailyJobs, dailyBookings, dailyProducts },
    });
  } catch (error) {
    next(error);
  }
};
