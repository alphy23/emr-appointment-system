const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const doctorService = require("../services/doctor.service");

const createDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.createDoctor(req.body);
  res.status(201).json(new ApiResponse(true, "Doctor created successfully", result));
});

const listDoctors = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const doctors = await doctorService.listDoctors({ department });
  res.status(200).json(new ApiResponse(true, "Doctors fetched successfully", doctors));
});

module.exports = { createDoctor, listDoctors };