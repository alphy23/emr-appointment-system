const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const patientService = require("./patient.service");
const scheduleService = require("./schedule.service");
const generateSlots = require("../utils/generateSlots");
const { getDayName, getTodayStr, isPastDate } = require("../utils/date");
const { timeToMinutes } = require("../utils/time");
const ApiError = require("../utils/ApiError");
const auditLogService = require("./auditLog.service");

// Confirms the requested slot is actually a real slot generated from the
// doctor's current schedule — prevents booking arbitrary/fabricated times
// that don't align with sessions, duration, or break periods.
const assertSlotIsValid = async (doctorId, date, slotStartTime, slotEndTime) => {
  if (isPastDate(date)) throw new ApiError(400, "Cannot book an appointment on a past date");

  const schedule = await scheduleService.getScheduleByDoctor(doctorId);
  const dayName = getDayName(date);
  if (!schedule.workingDays.includes(dayName)) {
    throw new ApiError(400, "Doctor does not work on this day");
  }

  const validSlots = generateSlots(schedule.sessions, schedule.breaks, schedule.slotDuration);
  const matches = validSlots.some(
    (s) => s.startTime === slotStartTime && s.endTime === slotEndTime
  );
  if (!matches) throw new ApiError(400, "Requested slot is not a valid slot for this doctor");

  const isToday = date === getTodayStr();
  if (isToday) {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    if (timeToMinutes(slotStartTime) <= nowMinutes) {
      throw new ApiError(400, "Cannot book a past time slot");
    }
  }
};

const createAppointment = async (payload, actor) => {
  const { doctorId, department, date, slotStartTime, slotEndTime, purpose, patientId, newPatient } =
    payload;

  await assertSlotIsValid(doctorId, date, slotStartTime, slotEndTime);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patient = await patientService.findOrCreatePatient(
      { patientId, newPatientData: newPatient },
      session
    );

    // The unique partial index on the Appointment model is what actually
    // prevents double booking. If two requests race for the same slot,
    // MongoDB rejects the second insert with a duplicate key error (11000) —
    // this is enforced at the database layer, so it holds even under
    // concurrent requests from multiple servers/processes.
    const [appointment] = await Appointment.create(
      [
        {
          doctor: doctorId,
          patient: patient._id,
          department,
          date,
          slotStartTime,
          slotEndTime,
          purpose,
          createdBy: actor.id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await auditLogService.log({
      user: actor.id,
      role: actor.role,
      action: "APPOINTMENT_CREATED",
      entity: "Appointment",
      entityId: appointment._id,
    });

    return appointment.populate(["doctor", "patient"]);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // MongoDB duplicate key error → this slot was just taken by another request
    if (err.code === 11000) {
      throw new ApiError(409, "This slot has just been booked by someone else. Please choose another slot.");
    }
    throw err;
  }
};

const getAppointmentById = async (id) => {
  const appointment = await Appointment.findById(id).populate(["doctor", "patient"]);
  if (!appointment) throw new ApiError(404, "Appointment not found");
  return appointment;
};

module.exports = { createAppointment, getAppointmentById };