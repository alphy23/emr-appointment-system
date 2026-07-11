const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const validateQuery = require("../../middlewares/validateQuery");
const auditLogController = require("../../controllers/auditLog.controller");
const { listAuditLogsSchema } = require("../../validators/auditLog.validator");

// Only Super Admin can view the audit trail
router.get(
  "/",
  authenticate,
  authorize("superadmin"),
  validateQuery(listAuditLogsSchema),
  auditLogController.listAuditLogs
);

module.exports = router;