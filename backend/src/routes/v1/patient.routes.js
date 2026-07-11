const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const validate = require("../../middlewares/validate");
const validateQuery = require("../../middlewares/validateQuery");
const patientController = require("../../controllers/patient.controller");
const { createPatientSchema, searchPatientSchema } = require("../../validators/patient.validator");

router.use(authenticate);

// Only Super Admin and Receptionist deal with patient records directly
router.post(
  "/",
  authorize("superadmin", "receptionist"),
  validate(createPatientSchema),
  patientController.createPatient
);

router.get(
  "/search",
  authorize("superadmin", "receptionist"),
  validateQuery(searchPatientSchema),
  patientController.searchPatients
);

router.get("/:id", authorize("superadmin", "receptionist", "doctor"), patientController.getPatient);

module.exports = router;