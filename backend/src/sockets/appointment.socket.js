const { getIO } = require("../config/socket");

// Centralizes the room-naming convention and event name so every service
// call site emits consistently — one place to change the shape later.
const emitAppointmentEvent = (eventName, appointment) => {
  try {
    const io = getIO();
    const room = `doctor:${appointment.doctor._id || appointment.doctor}:date:${appointment.date}`;
    io.to(room).emit(eventName, {
      appointmentId: appointment._id,
      doctor: appointment.doctor,
      patient: appointment.patient,
      date: appointment.date,
      slotStartTime: appointment.slotStartTime,
      slotEndTime: appointment.slotEndTime,
      status: appointment.status,
    });
  } catch (err) {
    // Socket emission should never break the actual HTTP request/response
    console.error("Socket emit failed:", err.message);
  }
};

module.exports = { emitAppointmentEvent };