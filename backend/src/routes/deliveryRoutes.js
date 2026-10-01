const express = require("express");
const router = express.Router();

const deliveryController = require("../controllers/deliveryController");
const authMiddleware = require("../middleware/authMiddleware");

// Create Delivery (Customer)
router.post("/", authMiddleware, deliveryController.createDelivery);

// Get My Deliveries (Customer)
router.get("/my", authMiddleware, deliveryController.getMyDeliveries);

module.exports = router;
