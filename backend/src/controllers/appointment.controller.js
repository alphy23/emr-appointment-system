const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const appointmentService = require("../services/appointment.service");

const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointment(req.body, req.user);
  res.status(201).json(new ApiResponse(true, "Appointment created successfully", appointment));
});

const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(req.params.id);
  res.status(200).json(new ApiResponse(true, "Appointment fetched successfully", appointment));
});

module.exports = { createAppointment, getAppointment };