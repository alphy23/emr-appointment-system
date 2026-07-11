const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/doctors", require("./doctor.routes"));
router.use("/receptionists", require("./receptionist.routes"));
router.use("/slots", require("./slot.routes"));
router.use("/patients", require("./patient.routes"));
router.use("/appointments", require("./appointment.routes"));

module.exports = router;