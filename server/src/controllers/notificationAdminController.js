import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const sendBulk = async (req, res, next) => {
  try {
    const { userIds, title, message, type } = req.body;
    if (!userIds?.length || !title || !message) {
      return res.status(400).json({ success: false, message: 'userIds, title, and message are required' });
    }

    const notifications = userIds.map((userId) => ({
      userId,
      type: type || 'admin',
      title,
      message,
      fromUserId: req.user.id,
    }));

    await Notification.insertMany(notifications);

    res.json({ success: true, message: `Notification sent to ${notifications.length} users`, data: { sentCount: notifications.length } });
  } catch (error) {
    next(error);
  }
};

export const sendToAll = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message are required' });
    }

    const users = await User.find({}).select('_id');
    const notifications = users.map((u) => ({
      userId: u._id,
      type: type || 'admin',
      title,
      message,
      fromUserId: req.user.id,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, message: `Notification sent to all ${notifications.length} users`, data: { sentCount: notifications.length } });
  } catch (error) {
    next(error);
  }
};

export const sendToRole = async (req, res, next) => {
  try {
    const { role, title, message, type } = req.body;
    if (!role || !title || !message) {
      return res.status(400).json({ success: false, message: 'role, title, and message are required' });
    }

    const users = await User.find({ role }).select('_id');
    const notifications = users.map((u) => ({
      userId: u._id,
      type: type || 'admin',
      title,
      message,
      fromUserId: req.user.id,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, message: `Notification sent to ${notifications.length} ${role} users`, data: { sentCount: notifications.length } });
  } catch (error) {
    next(error);
  }
};

export const sendToUser = async (req, res, next) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, message: 'userId, title, and message are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Notification.create({
      userId,
      type: type || 'admin',
      title,
      message,
      fromUserId: req.user.id,
    });

    res.json({ success: true, message: 'Notification sent successfully', data: { user: user.name } });
  } catch (error) {
    next(error);
  }
};

export const getNotificationStats = async (_req, res, next) => {
  try {
    const [totalNotifications, unreadByUser, recentNotifications] = await Promise.all([
      Notification.countDocuments(),
      Notification.aggregate([
        { $match: { isRead: false } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Notification.find().sort({ createdAt: -1 }).limit(10).select('userId type title message isRead createdAt'),
    ]);

    res.json({
      success: true,
      data: {
        totalNotifications,
        unreadUsers: unreadByUser.length,
        recentNotifications: recentNotifications.map((n) => ({ id: n._id.toString(), userId: n.userId?.toString(), type: n.type, title: n.title, message: n.message, isRead: n.isRead, createdAt: n.createdAt })),
      },
    });
  } catch (error) {
    next(error);
  }
};
