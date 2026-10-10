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
            totalRiders,
            activeRiders,
            activeDeliveries,
            completedDeliveries,
            pendingDeliveries,
            cancelledDeliveries
        ] = await Promise.all([
            prisma.user.count({ where: { role: "RIDER" } }),
            prisma.user.count({ where: { role: "RIDER", status: true } }),
            prisma.delivery.count({ where: { status: { in: ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"] } } }),
            prisma.delivery.count({ where: { status: "DELIVERED" } }),
            prisma.delivery.count({ where: { status: "PENDING" } }),
            prisma.delivery.count({ where: { status: "CANCELLED" } })
        ]);

        res.json({
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

exports.createRider = createRider;
exports.getDashboardStats = getDashboardStats;