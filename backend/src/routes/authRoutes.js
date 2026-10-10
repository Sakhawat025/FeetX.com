const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Customer signup
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);
// getMe
router.get("/me", authMiddleware, authController.getMe);

router.put("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
