const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/doctors", require("./doctor.routes"));
router.use("/receptionists", require("./receptionist.routes"));

module.exports = router;