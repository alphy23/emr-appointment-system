const { z } = require("zod");

const createDoctorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  department: z.string().min(2, "Department is required"),
  specialization: z.string().optional(),
  phone: z.string().optional(),
});

module.exports = { createDoctorSchema };