const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const validate = require("../../middlewares/validate");
const appointmentController = require("../../controllers/appointment.controller");
const validateQuery = require("../../middlewares/validateQuery");
const {
  listAppointmentsSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  cancelAppointmentSchema,
} = require("../../validators/appointment.validator");


router.use(authenticate);

router.post(
  "/",
  authorize("superadmin", "receptionist"),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get("/:id", appointmentController.getAppointment);

router.put(
  "/:id",
  authorize("superadmin", "receptionist", "doctor"),
  validate(updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.post(
  "/:id/arrive",
  authorize("superadmin", "receptionist"),
  appointmentController.markArrived
);

router.post(
  "/:id/complete",
  authorize("superadmin", "doctor"),
  appointmentController.completeAppointment
);

router.delete(
  "/:id",
  authorize("superadmin", "receptionist"),
  validate(cancelAppointmentSchema),
  appointmentController.cancelAppointment
);

router.get(
  "/",
  authorize("superadmin", "receptionist", "doctor"),
  validateQuery(listAppointmentsSchema),
  appointmentController.listAppointments
);

module.exports = router;