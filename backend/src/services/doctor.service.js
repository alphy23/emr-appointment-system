const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const ApiError = require("../utils/ApiError");

const createDoctor = async ({ name, email, password, department, specialization, phone }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "Email already in use");

  // Transaction: User + Doctor profile must be created together, or not at all
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [user] = await User.create(
      [{ name, email, password, role: "doctor" }],
      { session }
    );

    const [doctor] = await Doctor.create(
      [{ user: user._id, name, department, specialization, phone }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      doctor,
      account: { id: user._id, email: user.email, role: user.role },
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const listDoctors = async ({ department } = {}) => {
  const filter = { isActive: true };
  if (department) filter.department = department;
  return Doctor.find(filter)
    .select("name department specialization phone")
    .sort({ name: 1 });
};

const getDoctorById = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");
  return doctor;
};

module.exports = { createDoctor, listDoctors, getDoctorById };