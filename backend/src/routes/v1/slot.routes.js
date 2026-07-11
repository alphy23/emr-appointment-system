const express = require("express");
const router = express.Router();
const authenticate = require("../../middlewares/authenticate");
const validateQuery = require("../../middlewares/validateQuery");
const slotController = require("../../controllers/slot.controller");
const { getSlotsSchema } = require("../../validators/slot.validator");

router.get("/", authenticate, validateQuery(getSlotsSchema), slotController.getSlots);

module.exports = router;