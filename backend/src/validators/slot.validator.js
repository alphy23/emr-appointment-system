const { z } = require("zod");

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const getSlotsSchema = z.object({
  doctorId: z.string().min(1, "doctorId is required"),
  date: z.string().regex(dateRegex, "date must be in YYYY-MM-DD format"),
});

module.exports = { getSlotsSchema };