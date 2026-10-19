const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const createRider = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const rider = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: "RIDER"
            }
        });
        const { password: removePassword, ...safeRider } = rider;
        res.status(201).json({
            message: "Rider created successfully",
            rider: safeRider
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalDeliveries,
            totalRiders,
            activeRiders,
            activeDeliveries,
            completedDeliveries,
            pendingDeliveries,
            cancelledDeliveries
        ] = await Promise.all([
            prisma.delivery.count(),
            prisma.user.count({ where: { role: "RIDER" } }),
            prisma.user.count({ where: { role: "RIDER", status: true } }),
            prisma.delivery.count({ where: { status: { in: ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"] } } }),
            prisma.delivery.count({ where: { status: "DELIVERED" } }),
            prisma.delivery.count({ where: { status: "PENDING" } }),
            prisma.delivery.count({ where: { status: "CANCELLED" } })
        ]);

        res.json({
            totalDeliveries,
            totalRiders,
            activeRiders,
            activeDeliveries,
            completedDeliveries,
            pendingDeliveries,
            cancelledDeliveries
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Failed to load dashboard statistics" });
    }
};

const getLiveRiders = async (req, res) => {
    try {
        const riders = await prisma.user.findMany({
            where: { role: "RIDER" },
            select: {
                id: true,
                name: true,
                phone: true,
                status: true
            },
            orderBy: { name: "asc" }
        });
        res.json(riders);
    } catch (error) {
        console.error("Live riders error:", error);
        res.status(500).json({ message: "Failed to load riders" });
    }
};

const getDailyDeliveryPerformance = async (req, res) => {
    try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const deliveries = await prisma.delivery.findMany({
            where: {
                updatedAt: { gte: startDate },
                status: { in: ["DELIVERED", "CANCELLED"] }
            },
            select: { status: true, updatedAt: true },
            orderBy: { updatedAt: "asc" }
        });

        const performance = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayDeliveries = deliveries.filter((delivery) => {
                const deliveryDate = new Date(delivery.updatedAt);
                return deliveryDate >= dayStart && deliveryDate <= dayEnd;
            });

            const delivered = dayDeliveries.filter((d) => d.status === "DELIVERED").length;
            const cancelled = dayDeliveries.filter((d) => d.status === "CANCELLED").length;

            performance.push({
                day: date.toLocaleDateString("en-US", { weekday: "short" }),
                delivered,
                cancelled
            });
        }

        res.json(performance);
    } catch (error) {
        console.error("Daily performance error:", error);
        res.status(500).json({ message: "Failed to load daily delivery performance" });
    }
};

const getPendingAssignments = async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        riderId: null,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
        trackingId: true,
        receiverName: true,
        pickupAddress: true,
        deliveryAddress: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(deliveries);
  } catch (error) {
    console.error("Pending assignments error:", error);

    res.status(500).json({
      message: "Failed to load pending assignments",
    });
  }
};




exports.createRider = createRider;
exports.getDashboardStats = getDashboardStats;
exports.getLiveRiders = getLiveRiders;
exports.getDailyDeliveryPerformance = getDailyDeliveryPerformance;
exports.getPendingAssignments = getPendingAssignments;