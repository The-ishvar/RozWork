import { Report } from '../models/Chat.js';
import User from '../models/User.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, entityType, reporterId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (entityType) filter.entityType = entityType;
    if (reporterId) filter.reporterId = reporterId;

    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(filter),
    ]);

    const enriched = await Promise.all(reports.map(async (r) => {
      const reporter = r.reporterId ? await User.findById(r.reporterId).select('name email').lean() : null;
      return {
        id: r._id.toString(),
        reporterId: r.reporterId?.toString() || '',
        reporterName: reporter?.name || 'Unknown',
        reporterEmail: reporter?.email || '',
        entityType: r.entityType,
        entityId: r.entityId?.toString() || '',
        reason: r.reason,
        description: r.description || '',
        status: r.status,
        reviewedBy: r.reviewedBy?.toString() || null,
        reviewedAt: r.reviewedAt || null,
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
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    const reporter = report.reporterId ? await User.findById(report.reporterId).select('name email phone').lean() : null;
    res.json({ success: true, data: { ...report.toObject(), id: report._id.toString(), reporter } });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date(), reviewedBy: req.user.id },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: { id: report._id.toString(), status: report.status }, message: `Report ${status} successfully` });
  } catch (error) {
    next(error);
  }
};

export const getReportsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find({ entityType: type })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments({ entityType: type }),
    ]);

    res.json({
      success: true,
      data: reports.map((r) => ({ id: r._id.toString(), entityType: r.entityType, reason: r.reason, status: r.status, createdAt: r.createdAt })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getReportStats = async (_req, res, next) => {
  try {
    const [totalReports, pendingReports, byStatus, byType] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$entityType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    res.json({ success: true, data: { totalReports, pendingReports, byStatus, byType } });
  } catch (error) {
    next(error);
  }
};
