const AuditLog = require("../models/AuditLog");

const log = async ({ user, role, action, entity, entityId, meta = {} }) => {
  // Fire-and-forget: audit logging should never block or fail the main request
  try {
    await AuditLog.create({ user, role, action, entity, entityId, meta });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

const listAuditLogs = async (query) => {
  const { user, role, action, entity, dateFrom, dateTo, page, limit } = query;

  const filter = {};
  if (user) filter.user = user;
  if (role) filter.role = role;
  if (action) filter.action = action;
  if (entity) filter.entity = entity;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      // include the entire "to" day, not just midnight
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = { log, listAuditLogs  };