const { z } = require("zod");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const sessionSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(timeRegex, "startTime must be HH:mm"),
  endTime: z.string().regex(timeRegex, "endTime must be HH:mm"),
});

const breakSchema = z.object({
  startTime: z.string().regex(timeRegex, "startTime must be HH:mm"),
  endTime: z.string().regex(timeRegex, "endTime must be HH:mm"),
});

const upsertScheduleSchema = z.object({
  workingDays: z
    .array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    .min(1, "At least one working day is required"),
  sessions: z.array(sessionSchema).min(1, "At least one session is required"),
  breaks: z.array(breakSchema).default([]),
  slotDuration: z.number().int().min(5).max(120),
});

module.exports = { upsertScheduleSchema };