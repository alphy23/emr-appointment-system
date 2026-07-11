const Appointment = require("../models/Appointment");
const scheduleService = require("./schedule.service");
const generateSlots = require("../utils/generateSlots");
const { getDayName, getTodayStr, isPastDate } = require("../utils/date");
const { timeToMinutes } = require("../utils/time");
const ApiError = require("../utils/ApiError");

const getAvailableSlots = async (doctorId, date) => {
  if (isPastDate(date)) {
    throw new ApiError(400, "Cannot fetch slots for a past date");
  }

  const schedule = await scheduleService.getScheduleByDoctor(doctorId);

  const dayName = getDayName(date);
  if (!schedule.workingDays.includes(dayName)) {
    return { date, doctor: doctorId, slots: [] }; // doctor doesn't work this day
  }

  const allSlots = generateSlots(schedule.sessions, schedule.breaks, schedule.slotDuration);

  // Any non-cancelled appointment on this date/doctor occupies its slot
  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date,
    status: { $ne: "Cancelled" },
  }).select("slotStartTime -_id");

  const bookedSet = new Set(bookedAppointments.map((a) => a.slotStartTime));

  const isToday = date === getTodayStr();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const slots = allSlots.map((slot) => {
    const isPast = isToday && timeToMinutes(slot.startTime) <= nowMinutes;
    const isBooked = bookedSet.has(slot.startTime);

    let status = "available";
    if (isBooked) status = "booked";
    else if (isPast) status = "past";

    return { ...slot, status };
  });

  return { date, doctor: doctorId, slots };
};

module.exports = { getAvailableSlots };