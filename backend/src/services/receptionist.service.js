const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const createReceptionist = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "Email already in use");

  const user = await User.create({ name, email, password, role: "receptionist" });
  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

module.exports = { createReceptionist };