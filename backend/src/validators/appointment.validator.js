const { z } = require("zod");

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const newPatientSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^\d{10}$/),
  age: z.number().int().min(0).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().optional(),
});

const createAppointmentSchema = z
  .object({
    doctorId: z.string().min(1, "doctorId is required"),
    department: z.string().min(1, "department is required"),
    date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
    slotStartTime: z.string().regex(timeRegex, "slotStartTime must be HH:mm"),
    slotEndTime: z.string().regex(timeRegex, "slotEndTime must be HH:mm"),
    purpose: z.string().optional(),
    patientId: z.string().optional(),
    newPatient: newPatientSchema.optional(),
  })
  .refine((data) => data.patientId || data.newPatient, {
    message: "Either patientId or newPatient details are required",
    path: ["patientId"],
  });

module.exports = { createAppointmentSchema };