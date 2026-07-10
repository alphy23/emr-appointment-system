const Schedule = require("../models/Schedule");
const Doctor = require("../models/Doctor");
const ApiError = require("../utils/ApiError");
const { timeToMinutes } = require("../utils/time");

// Ensures a list of time blocks (sessions, or sessions+breaks combined)
// don't overlap each other — critical so slot generation never double-counts time
const validateNoOverlap = (blocks) => {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (let i = 0; i < sorted.length; i++) {
    const { startTime, endTime } = sorted[i];
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      throw new ApiError(400, `Invalid time range: ${startTime} - ${endTime}`);
    }
    if (i > 0 && timeToMinutes(startTime) < timeToMinutes(sorted[i - 1].endTime)) {
      throw new ApiError(400, "Sessions and breaks must not overlap");
    }
  }
};

const upsertSchedule = async (doctorId, payload) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  validateNoOverlap(payload.sessions);
  if (payload.breaks.length) {
    validateNoOverlap([...payload.sessions, ...payload.breaks]);
  }

  const schedule = await Schedule.findOneAndUpdate(
    { doctor: doctorId },
    { doctor: doctorId, ...payload },
    { new: true, upsert: true, runValidators: true }
  );

  return schedule;
};

const getScheduleByDoctor = async (doctorId) => {
  const schedule = await Schedule.findOne({ doctor: doctorId });
  if (!schedule) throw new ApiError(404, "Schedule not configured for this doctor");
  return schedule;
};

module.exports = { upsertSchedule, getScheduleByDoctor };