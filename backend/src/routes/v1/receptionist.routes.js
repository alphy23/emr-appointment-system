const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");
const validate = require("../../middlewares/validate");
const receptionistController = require("../../controllers/receptionist.controller");
const { createReceptionistSchema } = require("../../validators/receptionist.validator");

router.post(
  "/",
  authenticate,
  authorize("superadmin"),
  validate(createReceptionistSchema),
  receptionistController.createReceptionist
);

module.exports = router;