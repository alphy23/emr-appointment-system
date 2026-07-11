const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const auditLogService = require("../services/auditLog.service");

const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.listAuditLogs(req.query);
  res
    .status(200)
    .json(new ApiResponse(true, "Audit logs fetched successfully", result.logs, result.meta));
});

module.exports = { listAuditLogs };