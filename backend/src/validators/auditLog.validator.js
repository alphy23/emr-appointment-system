const { z } = require("zod");

const listAuditLogsSchema = z.object({
  user: z.string().optional(),
  role: z.enum(["superadmin", "receptionist", "doctor"]).optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = { listAuditLogsSchema };