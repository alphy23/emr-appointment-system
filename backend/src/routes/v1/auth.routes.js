const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth.controller");
const validate = require("../../middlewares/validate");
const { loginSchema } = require("../../validators/auth.validator");

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

module.exports = router;