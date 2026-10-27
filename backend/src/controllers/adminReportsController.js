const prisma = require("../config/prisma");

const {
  parseFilters,
  buildReport,
} = require("../services/adminReportsService");

exports.getReports = async (req, res) => {
  try {
    const filters = parseFilters(req.query);

    const result = await prisma.$transaction(
      async (tx) => {
        const admin = await tx.user.findFirst({
          where: {
            id: req.user.id,
            role: "ADMIN",
            status: true,
          },
          select: { id: true },
        });

        if (!admin) {
          throw Object.assign(
            new Error("Active administrator access required."),
            { status: 403 }
          );
        }

        const riders = await tx.user.findMany({
          where: { role: "RIDER" },
          select: {
            id: true,
            name: true,
            status: true,
          },
          orderBy: [
            { name: "asc" },
            { id: "asc" },
          ],
        });

        if (
          filters.riderId !== null &&
          !riders.some(
            (rider) => rider.id === filters.riderId
          )
        ) {
          throw Object.assign(
            new Error("Rider not found."),
            { status: 404 }
          );
        }

        const rows = await tx.delivery.findMany({
          where: {
            ...(filters.riderId !== null
              ? { riderId: filters.riderId }
              : {}),

            OR: [
              {
                createdAt: {
                  gte: filters.start,
                  lt: filters.end,
                },
              },
              {
                status: "DELIVERED",
                deliveredAt: {
                  gte: filters.start,
                  lt: filters.end,
                },
              },
            ],
          },

          select: {
            id: true,
            trackingId: true,
            riderId: true,
            status: true,
            priority: true,
            createdAt: true,
            assignedAt: true,
            deliveredAt: true,
            dueAt: true,
            rating: true,
            pickupLatitude: true,
            pickupLongitude: true,
            deliveryLatitude: true,
            deliveryLongitude: true,
          },

          orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
          ],

          take: 10001,
        });

        if (rows.length > 10000) {
          throw Object.assign(
            new Error(
              "Report exceeds 10,000 records. Choose a shorter period or one rider."
            ),
            { status: 422 }
          );
        }

        return { rows, riders };
      },
      {
        isolationLevel: "RepeatableRead",
        timeout: 15000,
      }
    );

    res.set("Cache-Control", "no-store");

    res.json(
      buildReport(
        result.rows,
        result.riders,
        filters
      )
    );
  } catch (error) {
    if (!error.status) {
      console.error("Admin reports:", error);
    }

    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to generate reports. Please retry.",
    });
  }
};