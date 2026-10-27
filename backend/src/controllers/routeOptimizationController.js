const prisma = require("../config/prisma");

const {
  buildStops,
  compareRoutes,
  freshLocation,
} = require("../services/routeOptimizationService");

const ACTIVE = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"];

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function positiveId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    fail(400, "Invalid rider ID.");
  }

  return id;
}

async function plan(req, res, reordered) {
  try {
    const selected = reordered
      ? positiveId(req.body.riderId)
      : req.query.riderId === undefined
      ? null
      : positiveId(req.query.riderId);

    if (reordered && !Array.isArray(req.body.stopOrder)) {
      fail(400, "stopOrder must be an array of stop keys.");
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        role: "ADMIN",
        status: true,
      },
      select: { id: true },
    });

    if (!admin) {
      fail(403, "Admin account unavailable.");
    }

    // External routing requests run outside database transactions.
    const riders = await prisma.user.findMany({
      where: {
        role: "RIDER",
        status: true,
        riderDeliveries: {
          some: {
            status: { in: ACTIVE },
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        zone: true,
        riderLocation: true,
        assignedVehicle: {
          select: {
            name: true,
            type: true,
          },
        },
        riderDeliveries: {
          where: {
            status: { in: ACTIVE },
          },
          orderBy: [
            { assignedAt: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
            trackingId: true,
            pickupAddress: true,
            deliveryAddress: true,
            pickupLatitude: true,
            pickupLongitude: true,
            deliveryLatitude: true,
            deliveryLongitude: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: [
        { name: "asc" },
        { id: "asc" },
      ],
    });

    const rider =
      selected === null
        ? riders[0]
        : riders.find((item) => item.id === selected);

    if (selected !== null && !rider) {
      fail(
        404,
        "Selected rider has no active deliveries or is unavailable. Refresh the rider list."
      );
    }

    function summary(item) {
      return {
        id: item.id,
        name: item.name,
        phone: item.phone,
        zone: item.zone,
        vehicleName: item.assignedVehicle?.name || null,
        vehicleType: item.assignedVehicle?.type || null,
        activeDeliveries: item.riderDeliveries.length,
      };
    }

    let optimization = null;

    if (rider) {
      try {
        const stops = buildStops(
          rider.riderLocation,
          rider.riderDeliveries
        );

        optimization = await compareRoutes(
          stops,
          reordered ? req.body.stopOrder : undefined
        );
      } catch (error) {
        if (error.status !== 409 && error.status !== 502) {
          throw error;
        }

        optimization = {
          blocker: error.message,
        };
      }
    }

    res.set("Cache-Control", "no-store");

    res.json({
      riders: riders.map(summary),
      rider: rider
        ? {
            ...summary(rider),
            location: freshLocation(rider.riderLocation),
          }
        : null,
      optimization,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (!error.status) {
      console.error("Route optimization:", error);
    }

    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to process route optimization.",
    });
  }
}

exports.getOptimization = (req, res) => plan(req, res, false);

exports.reorderStops = (req, res) => plan(req, res, true);