const express = require("express");
const router = express.Router();
const riderController = require("../controllers/riderController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");


router.get(
    "/dashboard-stats",
    authMiddleware,
    allowRoles("RIDER"),
    riderController.getDashboardStats
);

router.get(
    "/current-task",
    authMiddleware,
    allowRoles("RIDER"),
    riderController.getCurrentTask
);

router.get(
    "/assigned-deliveries",
    authMiddleware,
    allowRoles("RIDER"),
    riderController.getAssignedDeliveries
);

module.exports = router;
