const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const validate = require("../../middlewares/validate");
const doctorController = require("../../controllers/doctor.controller");
const scheduleController = require("../../controllers/schedule.controller");
const { createDoctorSchema } = require("../../validators/doctor.validator");
const { upsertScheduleSchema } = require("../../validators/schedule.validator");

router.use(authenticate); // every route below requires a logged-in user

router.post("/", authorize("superadmin"), validate(createDoctorSchema), doctorController.createDoctor);
router.get("/", doctorController.listDoctors); // any authenticated role can view doctors

router.put(
  "/:doctorId/schedule",
  authorize("superadmin"),
  validate(upsertScheduleSchema),
  scheduleController.upsertSchedule
);
router.get("/:doctorId/schedule", scheduleController.getSchedule);

module.exports = router;