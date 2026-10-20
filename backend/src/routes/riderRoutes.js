const express = require("express");
const router = express.Router();

const riderController = require("../controllers/riderController");
const deliveryWorkflowController = require(
  "../controllers/deliveryWorkflowController"
);

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const riderProfileController = require("../controllers/riderProfileController");


router.use(authMiddleware, allowRoles("RIDER"));

router.get("/profile", riderProfileController.getProfile);
router.patch("/profile", riderProfileController.updateProfile);

router.get(
  "/dashboard-stats",
  riderController.getDashboardStats
);

router.get(
  "/current-task",
  riderController.getCurrentTask
);

router.get(
  "/assigned-deliveries",
  deliveryWorkflowController.getAssignedDeliveries
);

router.patch(
  "/deliveries/:id/status",
  deliveryWorkflowController.updateStatus
);

module.exports = router;