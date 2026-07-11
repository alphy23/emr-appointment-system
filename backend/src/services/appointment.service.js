const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const patientService = require("./patient.service");
const scheduleService = require("./schedule.service");
const generateSlots = require("../utils/generateSlots");
const { getDayName, getTodayStr, isPastDate } = require("../utils/date");
const { timeToMinutes } = require("../utils/time");
const ApiError = require("../utils/ApiError");
const auditLogService = require("./auditLog.service");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { emitAppointmentEvent } = require("../sockets/appointment.socket");

// Defines which status transitions are legal. Anything not listed here is rejected.
const ALLOWED_TRANSITIONS = {
  Scheduled: ["Arrived", "Cancelled"],
  Arrived: ["Completed", "Cancelled"],
  Completed: [], // terminal
  Cancelled: [], // terminal
};

const assertTransitionAllowed = (currentStatus, nextStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Cannot change appointment status from "${currentStatus}" to "${nextStatus}"`,
    );
  }
};

// Doctors can only act on their own appointments — resolves Doctor doc from the User id
const assertDoctorOwnsAppointment = async (appointment, actor) => {
  if (actor.role !== "doctor") return;
  const doctorProfile = await Doctor.findOne({ user: actor.id });
  if (
    !doctorProfile ||
    String(appointment.doctor) !== String(doctorProfile._id)
  ) {
    throw new ApiError(403, "You can only manage your own appointments");
  }
};

/**
 * Updates purpose/notes. Field-level permission:
 * - Receptionist / Super Admin: can update purpose and notes
 * - Doctor: can update notes only, and only on their own appointment
 */
const updateAppointment = async (id, updates, actor) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (["Completed", "Cancelled"].includes(appointment.status)) {
    throw new ApiError(
      400,
      `Cannot edit a ${appointment.status.toLowerCase()} appointment`,
    );
  }

  await assertDoctorOwnsAppointment(appointment, actor);

  if (actor.role === "doctor") {
    if (updates.purpose !== undefined) {
      throw new ApiError(403, "Doctors can only update consultation notes");
    }
    if (updates.notes !== undefined) appointment.notes = updates.notes;
  } else {
    if (updates.purpose !== undefined) appointment.purpose = updates.purpose;
    if (updates.notes !== undefined) appointment.notes = updates.notes;
  }

  await appointment.save();

  await auditLogService.log({
    user: actor.id,
    role: actor.role,
    action: "APPOINTMENT_UPDATED",
    entity: "Appointment",
    entityId: appointment._id,
    meta: updates,
  });

  const populated = await appointment.populate(["doctor", "patient"]);
  emitAppointmentEvent("appointment:updated", populated);
  return populated;
};

const markArrived = async (id, actor) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  assertTransitionAllowed(appointment.status, "Arrived");

  appointment.status = "Arrived";
  await appointment.save();

  await auditLogService.log({
    user: actor.id,
    role: actor.role,
    action: "APPOINTMENT_ARRIVED",
    entity: "Appointment",
    entityId: appointment._id,
  });

  const populated = await appointment.populate(["doctor", "patient"]);
  emitAppointmentEvent("appointment:updated", populated);
  return populated;
};

const completeAppointment = async (id, actor) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  await assertDoctorOwnsAppointment(appointment, actor);
  assertTransitionAllowed(appointment.status, "Completed");

  appointment.status = "Completed";
  await appointment.save();

  await auditLogService.log({
    user: actor.id,
    role: actor.role,
    action: "APPOINTMENT_COMPLETED",
    entity: "Appointment",
    entityId: appointment._id,
  });

  const populated = await appointment.populate(["doctor", "patient"]);
  emitAppointmentEvent("appointment:updated", populated);
  return populated;
};

const cancelAppointment = async (id, reason, actor) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  assertTransitionAllowed(appointment.status, "Cancelled");

  appointment.status = "Cancelled";
  appointment.cancelReason = reason;
  await appointment.save();
  // Note: the unique partial index only counts Scheduled/Arrived/Completed —
  // so this same slot becomes bookable again immediately after cancellation.

  await auditLogService.log({
    user: actor.id,
    role: actor.role,
    action: "APPOINTMENT_CANCELLED",
    entity: "Appointment",
    entityId: appointment._id,
    meta: { reason },
  });

  const populated = await appointment.populate(["doctor", "patient"]);
  emitAppointmentEvent("appointment:cancelled", populated);
  return populated;
};

// Confirms the requested slot is actually a real slot generated from the
// doctor's current schedule — prevents booking arbitrary/fabricated times
// that don't align with sessions, duration, or break periods.
const assertSlotIsValid = async (
  doctorId,
  date,
  slotStartTime,
  slotEndTime,
) => {
  if (isPastDate(date))
    throw new ApiError(400, "Cannot book an appointment on a past date");

  const schedule = await scheduleService.getScheduleByDoctor(doctorId);
  const dayName = getDayName(date);
  if (!schedule.workingDays.includes(dayName)) {
    throw new ApiError(400, "Doctor does not work on this day");
  }

  const validSlots = generateSlots(
    schedule.sessions,
    schedule.breaks,
    schedule.slotDuration,
  );
  const matches = validSlots.some(
    (s) => s.startTime === slotStartTime && s.endTime === slotEndTime,
  );
  if (!matches)
    throw new ApiError(
      400,
      "Requested slot is not a valid slot for this doctor",
    );

  const isToday = date === getTodayStr();
  if (isToday) {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    if (timeToMinutes(slotStartTime) <= nowMinutes) {
      throw new ApiError(400, "Cannot book a past time slot");
    }
  }
};

const createAppointment = async (payload, actor) => {
  const {
    doctorId,
    department,
    date,
    slotStartTime,
    slotEndTime,
    purpose,
    patientId,
    newPatient,
  } = payload;

  await assertSlotIsValid(doctorId, date, slotStartTime, slotEndTime);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patient = await patientService.findOrCreatePatient(
      { patientId, newPatientData: newPatient },
      session,
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
      { session },
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

    const populated = await appointment.populate(["doctor", "patient"]);
    emitAppointmentEvent("appointment:created", populated);
    return populated;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // MongoDB duplicate key error → this slot was just taken by another request
    if (err.code === 11000) {
      throw new ApiError(
        409,
        "This slot has just been booked by someone else. Please choose another slot.",
      );
    }
    throw err;
  }
};

const getAppointmentById = async (id) => {
  const appointment = await Appointment.findById(id).populate([
    "doctor",
    "patient",
  ]);
  if (!appointment) throw new ApiError(404, "Appointment not found");
  return appointment;
};

/**
 * Server-side filtering, sorting, and pagination for the appointment list.
 * RBAC scoping happens here, not in the controller — a Doctor's query is
 * forcibly narrowed to their own appointments regardless of what they pass in,
 * so there's no way to bypass this by manipulating query params.
 */
const listAppointments = async (query, actor) => {
  const {
    doctorId,
    department,
    status,
    dateFrom,
    dateTo,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const filter = {};

  // --- RBAC scoping ---
  if (actor.role === "doctor") {
    const doctorProfile = await Doctor.findOne({ user: actor.id }).select(
      "_id",
    );
    if (!doctorProfile) throw new ApiError(403, "Doctor profile not found");
    filter.doctor = doctorProfile._id; // doctor can NEVER see other doctors' appointments
  } else if (doctorId) {
    filter.doctor = doctorId; // superadmin/receptionist may optionally filter by doctor
  }

  if (department) filter.department = department;
  if (status) filter.status = status;

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }

  // Patient search (name or mobile) requires resolving patient IDs first,
  // since Appointment only stores a patient reference, not the name/mobile itself.
  // Avoided a $lookup aggregation here for simplicity — fine at this data volume,
  // documented as a scaling tradeoff in ENGINEERING_DECISIONS.md.
  if (search) {
    const matchingPatients = await Patient.find({
      $or: [{ name: { $regex: search, $options: "i" } }, { mobile: search }],
    }).select("_id");

    const patientIds = matchingPatients.map((p) => p._id);
    if (patientIds.length === 0) {
      return {
        appointments: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }
    filter.patient = { $in: patientIds };
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  const skip = (page - 1) * limit;

  // Run count + fetch in parallel — avoids a second round trip delay
  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("doctor", "name department")
      .populate("patient", "name mobile")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(), // lean() skips Mongoose document overhead — read-only list, no need for it
    Appointment.countDocuments(filter),
  ]);

  return {
    appointments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  markArrived,
  completeAppointment,
  cancelAppointment,
  listAppointments,
};
