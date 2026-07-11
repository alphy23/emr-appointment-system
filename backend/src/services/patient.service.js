const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const ApiError = require("../utils/ApiError");

const createPatient = async (payload) => {
  return Patient.create(payload);
};

/**
 * Searches by Patient ID (if the query looks like a valid ObjectId),
 * mobile number (exact match), or name (partial, case-insensitive).
 * Used by the receptionist's "existing patient" search during booking.
 */
const searchPatients = async (query) => {
  const orConditions = [
    { mobile: query },
    { name: { $regex: query, $options: "i" } },
  ];

  if (mongoose.Types.ObjectId.isValid(query)) {
    orConditions.unshift({ _id: query });
  }

  return Patient.find({ $or: orConditions }).limit(20).sort({ createdAt: -1 });
};

const getPatientById = async (patientId) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new ApiError(404, "Patient not found");
  return patient;
};

/**
 * Used internally by appointment booking (Step 6):
 * finds an existing patient by ID, or creates a new one if newPatientData is given.
 */
const findOrCreatePatient = async ({ patientId, newPatientData }, session) => {
  if (patientId) {
    const patient = await Patient.findById(patientId).session(session);
    if (!patient) throw new ApiError(404, "Patient not found");
    return patient;
  }

  if (!newPatientData) {
    throw new ApiError(400, "Either patientId or new patient details are required");
  }

  const [patient] = await Patient.create([newPatientData], { session });
  return patient;
};

module.exports = { createPatient, searchPatients, getPatientById, findOrCreatePatient };