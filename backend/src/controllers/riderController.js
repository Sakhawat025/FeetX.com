const prisma = require("../config/prisma");

// Rider Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const riderId = req.user.id;

        // Get rider name from database
        const rider = await prisma.user.findUnique({
            where: {
                id: riderId
            },
            select: {
                name: true
            }
        });

        const [
            todayDeliveries,
            completed,
            pending,
            totalDeliveries
        ] = await Promise.all([
            // Today's deliveries
            prisma.delivery.count({
                where: {
                    riderId,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),

            // Completed deliveries
            prisma.delivery.count({
                where: {
                    riderId,
                    status: "DELIVERED"
                }
            }),

            // Pending deliveries
            prisma.delivery.count({
                where: {
                    riderId,
                    status: {
                        in: [
                            "PENDING",
                            "CONFIRMED",
                            "PICKED_UP",
                            "OUT_FOR_DELIVERY"
                        ]
                    }
                }
            }),

            // Total deliveries
            prisma.delivery.count({
                where: {
                    riderId
                }
            })
        ]);

        res.json({
            name: rider?.name || "Rider",
            todayDeliveries,
            completed,
            pending,
            // Future database fields
            rating: 0,
            totalDeliveries,
            thisMonth: totalDeliveries,
            onTimeRate: "0%",
            avgDeliveryTime: "-"
        });
    } catch (error) {
        console.error("Rider dashboard error:", error);
        res.status(500).json({
            message: "Failed to load rider dashboard"
        });
    }
};

// Current Active Delivery
const getCurrentTask = async (req, res) => {
    try {
        const riderId = req.user.id;

        const currentTask = await prisma.delivery.findFirst({
            where: {
                riderId,
                status: {
                    in: [
                        "CONFIRMED",
                        "PICKED_UP",
                        "OUT_FOR_DELIVERY"
                    ]
                }
            },
            select: {
                id: true,
                trackingId: true,
                parcelType: true,
                parcelWeight: true,
                pickupAddress: true,
                deliveryAddress: true,
                status: true,
                createdAt: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json(currentTask);
    } catch (error) {
        console.error("Current task error:", error);
        res.status(500).json({
            message: "Failed to load current task"
        });
    }
};

exports.getAssignedDeliveries = async (req, res) => {
    try {
        const deliveries = await prisma.delivery.findMany({
            where: { riderId: req.user.id },
            select: {
                id: true,
                trackingId: true,
                parcelType: true,
                parcelWeight: true,
                pickupAddress: true,
                deliveryAddress: true,
                status: true,
                customer: { select: { name: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(
            deliveries.map(
                ({ customer, parcelType, parcelWeight, ...delivery }) => ({
                    ...delivery,
                    packageType: parcelType,
                    weight: parcelWeight,
                    customerName: customer?.name || "-"
                })
            )
        );
    } catch (error) {
        console.error("Assigned deliveries error:", error);
        res.status(500).json({
            message: "Failed to load assigned deliveries"
        });
    }
};


exports.getDashboardStats = getDashboardStats;
exports.getCurrentTask = getCurrentTask;
