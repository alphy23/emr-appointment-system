const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const scheduleService = require("../services/schedule.service");

const upsertSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.upsertSchedule(req.params.doctorId, req.body);
  res.status(200).json(new ApiResponse(true, "Schedule saved successfully", schedule));
});

const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.getScheduleByDoctor(req.params.doctorId);
  res.status(200).json(new ApiResponse(true, "Schedule fetched successfully", schedule));
});

module.exports = { upsertSchedule, getSchedule };