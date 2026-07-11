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

const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointment(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(true, "Appointment updated successfully", appointment));
});

const markArrived = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.markArrived(req.params.id, req.user);
  res.status(200).json(new ApiResponse(true, "Patient marked as arrived", appointment));
});

const completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.completeAppointment(req.params.id, req.user);
  res.status(200).json(new ApiResponse(true, "Appointment marked as completed", appointment));
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment(req.params.id, req.body.reason, req.user);
  res.status(200).json(new ApiResponse(true, "Appointment cancelled successfully", appointment));
});

const listAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.listAppointments(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(true, "Appointments fetched successfully", result.appointments, result.meta));
});

module.exports = {
  createAppointment,
  getAppointment,
  updateAppointment,
  markArrived,
  completeAppointment,
  cancelAppointment,
  listAppointments,
};