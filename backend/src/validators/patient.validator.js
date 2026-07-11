const { z } = require("zod");

const createPatientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  age: z.number().int().min(0).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().optional(),
});

const searchPatientSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

module.exports = { createPatientSchema, searchPatientSchema };