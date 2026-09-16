import LoginHistory from '../models/LoginHistory.js';
import UserActivity from '../models/UserActivity.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;
    const filter = {};

    if (action) filter.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      UserActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      UserActivity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs.map((l) => ({
        id: l._id.toString(),
        userId: l.userId?.toString() || '',
        username: l.username || '',
        fullName: l.fullName || '',
        email: l.email || '',
        role: l.role || '',
        action: l.action,
        entityType: l.entityType || '',
        entityTitle: l.entityTitle || '',
        details: l.details || '',
        ipAddress: l.ipAddress || '',
        deviceInfo: l.deviceInfo || '',
        createdAt: l.createdAt,
      })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getFailedLogins = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, email, startDate, endDate } = req.query;
    const filter = {};

    if (email) filter.email = { $regex: email, $options: 'i' };
    if (startDate || endDate) {
      filter.loginAt = {};
      if (startDate) filter.loginAt.$gte = new Date(startDate);
      if (endDate) filter.loginAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      LoginHistory.find(filter)
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LoginHistory.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs.map((l) => ({
        id: l._id.toString(),
        userId: l.userId?.toString() || '',
        username: l.username || '',
        fullName: l.fullName || '',
        email: l.email || '',
        role: l.role || '',
        loginAt: l.loginAt,
        ipAddress: l.ipAddress || '',
        deviceInfo: l.deviceInfo || '',
      })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getIPTracking = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const ipSummary = await LoginHistory.aggregate([
      { $group: { _id: '$ipAddress', count: { $sum: 1 }, users: { $addToSet: '$fullName' }, lastSeen: { $max: '$loginAt' } } },
      { $sort: { count: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    const total = await LoginHistory.aggregate([
      { $group: { _id: '$ipAddress' } },
      { $count: 'total' },
    ]);

    res.json({
      success: true,
      data: ipSummary.map((d) => ({
        ip: d._id || 'Unknown',
        count: d.count,
        users: d.users,
        lastSeen: d.lastSeen,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDeviceTracking = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const deviceSummary = await LoginHistory.aggregate([
      { $group: { _id: '$deviceInfo', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$fullName' } } },
      { $sort: { count: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    const total = await LoginHistory.aggregate([
      { $group: { _id: '$deviceInfo' } },
      { $count: 'total' },
    ]);

    res.json({
      success: true,
      data: deviceSummary.map((d) => ({
        device: d._id || 'Unknown',
        count: d.count,
        uniqueUsers: d.uniqueUsers.length,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getActivitySummary = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const [logins, activities, topActions, topUsers] = await Promise.all([
      LoginHistory.countDocuments({ loginAt: { $gte: startDate } }),
      UserActivity.countDocuments({ createdAt: { $gte: startDate } }),
      UserActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      UserActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, name: { $first: '$fullName' }, email: { $first: '$email' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalLogins: logins,
        totalActivities: activities,
        topActions,
        topUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
