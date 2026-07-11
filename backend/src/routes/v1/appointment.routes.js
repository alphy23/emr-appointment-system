const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const validate = require("../../middlewares/validate");
const appointmentController = require("../../controllers/appointment.controller");
const { createAppointmentSchema } = require("../../validators/appointment.validator");

router.use(authenticate);

router.post(
  "/",
  authorize("superadmin", "receptionist"),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get("/:id", appointmentController.getAppointment); // all roles can view a single appointment (RBAC on list comes in Step 8)

module.exports = router;