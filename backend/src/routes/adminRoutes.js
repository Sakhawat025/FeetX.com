const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const deliveryWorkflowController = require("../controllers/deliveryWorkflowController");
const adminAnalyticsController = require("../controllers/adminAnalyticsController");
const adminRidersController = require("../controllers/adminRidersController");
const adminVehiclesController = require("../controllers/adminVehiclesController");




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

router.get(
    "/live-riders",
    authMiddleware,
    allowRoles("ADMIN"),
    adminController.getLiveRiders
);

router.get(
    "/daily-delivery-performance",
    authMiddleware,
    allowRoles("ADMIN"),
    adminController.getDailyDeliveryPerformance
);

router.get(
    "/pending-assignments",
    authMiddleware,
    allowRoles("ADMIN"),
    adminController.getPendingAssignments
);

router.patch(
  "/deliveries/:id/assign",
  authMiddleware,
  allowRoles("ADMIN"),
  deliveryWorkflowController.assignRider
);

router.get(
  "/analytics",
  authMiddleware,
  allowRoles("ADMIN"),
  adminAnalyticsController.getAnalytics
);

router.get(
  "/riders",
  authMiddleware,
  allowRoles("ADMIN"),
  adminRidersController.listRiders
);

router.post(
  "/riders",
  authMiddleware,
  allowRoles("ADMIN"),
  adminRidersController.createRider
);

router.patch(
  "/riders/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  adminRidersController.updateRider
);

router.get(
  "/vehicles",
  authMiddleware,
  allowRoles("ADMIN"),
  adminVehiclesController.listVehicles
);

router.post(
  "/vehicles",
  authMiddleware,
  allowRoles("ADMIN"),
  adminVehiclesController.saveVehicle
);

router.put(
  "/vehicles/:id",
  authMiddleware,
  allowRoles("ADMIN"),
  adminVehiclesController.saveVehicle
);

module.exports = router;