const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const patientService = require("../services/patient.service");

const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient(req.body);
  res.status(201).json(new ApiResponse(true, "Patient created successfully", patient));
});

const searchPatients = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const patients = await patientService.searchPatients(query);
  res.status(200).json(new ApiResponse(true, "Patients fetched successfully", patients));
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);
  res.status(200).json(new ApiResponse(true, "Patient fetched successfully", patient));
});

module.exports = { createPatient, searchPatients, getPatient };