const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

router.post(
    "/create-rider",
    authMiddleware,
    allowRoles("ADMIN"),
    adminController.createRider
);

router.get(
    "/dashboard-stats",
    authMiddleware,
    allowRoles("ADMIN"),
    adminController.getDashboardStats
);

module.exports = router;