const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const receptionistService = require("../services/receptionist.service");

const createReceptionist = asyncHandler(async (req, res) => {
  const receptionist = await receptionistService.createReceptionist(req.body);
  res.status(201).json(new ApiResponse(true, "Receptionist created successfully", receptionist));
});

module.exports = { createReceptionist };