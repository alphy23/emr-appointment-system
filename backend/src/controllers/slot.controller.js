const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const slotService = require("../services/slot.service");

const getSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  const result = await slotService.getAvailableSlots(doctorId, date);
  res.status(200).json(new ApiResponse(true, "Slots fetched successfully", result));
});

module.exports = { getSlots };