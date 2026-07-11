const AuditLog = require("../models/AuditLog");

const log = async ({ user, role, action, entity, entityId, meta = {} }) => {
  // Fire-and-forget: audit logging should never block or fail the main request
  try {
    await AuditLog.create({ user, role, action, entity, entityId, meta });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

module.exports = { log };