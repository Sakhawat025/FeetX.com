const prisma = require("../config/prisma");

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function positiveId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    fail(400, "Invalid ID");
  }

  return id;
}

function sendError(res, error) {
  if (!error.status) {
    console.error("Delivery workflow error:", error);
  }

  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Could not complete the request",
  });
}

async function requireActiveUser(tx, userId, role) {
  const user = await tx.user.findFirst({
    where: {
      id: userId,
      role,
      status: true,
    },
    select: { id: true },
  });

  if (!user) {
    fail(403, "Your account cannot perform this action");
  }
}

// ADMIN: Assign a pending parcel to an active rider.
exports.assignRider = async (req, res) => {
  try {
    const deliveryId = positiveId(req.params.id);
    const riderId = positiveId(req.body.riderId);

    const delivery = await prisma.$transaction(async (tx) => {
      await requireActiveUser(tx, req.user.id, "ADMIN");

      const rider = await tx.user.findFirst({
        where: {
          id: riderId,
          role: "RIDER",
          status: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!rider) {
        fail(400, "Select an active rider");
      }

      const existing = await tx.delivery.findUnique({
        where: { id: deliveryId },
      });

      if (!existing) {
        fail(404, "Delivery not found");
      }

      // Conditional update prevents two admins assigning the same parcel at the same time.
      const result = await tx.delivery.updateMany({
        where: {
          id: deliveryId,
          riderId: null,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        data: {
          riderId,
          status: "CONFIRMED",
        },
      });

      if (result.count !== 1) {
        fail(409, "This delivery is already assigned or cannot be assigned");
      }

      await tx.notification.createMany({
        data: [
          {
            userId: existing.customerId,
            title: "Rider Assigned",
            message: `${rider.name} has been assigned to parcel ${existing.trackingId}.`,
            type: "DELIVERY",
          },
          {
            userId: rider.id,
            title: "New Delivery Assigned",
            message: `Parcel ${existing.trackingId} has been assigned to you.`,
            type: "DELIVERY",
          },
        ],
      });

      return tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });
    });

    return res.json(delivery);
  } catch (error) {
    return sendError(res, error);
  }
};

// RIDER: List only the logged-in rider's deliveries.
exports.getAssignedDeliveries = async (req, res) => {
  try {
    await requireActiveUser(prisma, req.user.id, "RIDER");

    const deliveries = await prisma.delivery.findMany({
      where: {
        riderId: req.user.id,
      },
      select: {
        id: true,
        trackingId: true,
        senderName: true,
        receiverName: true,
        receiverPhone: true,
        pickupAddress: true,
        deliveryAddress: true,
        parcelType: true,
        parcelWeight: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.json(deliveries);
  } catch (error) {
    return sendError(res, error);
  }
};

// RIDER: Only allow the next valid delivery step.
exports.updateStatus = async (req, res) => {
  try {
    const deliveryId = positiveId(req.params.id);
    const { status, expectedStatus } = req.body;

    const nextStatus = {
      CONFIRMED: "PICKED_UP",
      PICKED_UP: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
    };

    if (
      !Object.prototype.hasOwnProperty.call(nextStatus, expectedStatus) ||
      nextStatus[expectedStatus] !== status
    ) {
      fail(400, "Invalid delivery status transition");
    }

    const delivery = await prisma.$transaction(async (tx) => {
      await requireActiveUser(tx, req.user.id, "RIDER");

      const existing = await tx.delivery.findFirst({
        where: {
          id: deliveryId,
          riderId: req.user.id,
        },
      });

      if (!existing) {
        fail(404, "Assigned delivery not found");
      }

      // Ownership and previous status are checked during the database update.
      const result = await tx.delivery.updateMany({
        where: {
          id: deliveryId,
          riderId: req.user.id,
          status: expectedStatus,
        },
        data: {
          status,
        },
      });

      if (result.count !== 1) {
        fail(409, "Delivery status changed. Refresh and try again.");
      }

      const labels = {
        PICKED_UP: "Picked Up",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
      };

      await tx.notification.create({
        data: {
          userId: existing.customerId,
          title: `Parcel ${labels[status]}`,
          message: `Your parcel ${existing.trackingId} is now ${labels[status]}.`,
          type: "DELIVERY",
        },
      });

      return tx.delivery.findUnique({
        where: { id: deliveryId },
        select: {
          id: true,
          trackingId: true,
          status: true,
          updatedAt: true,
        },
      });
    });

    return res.json(delivery);
  } catch (error) {
    return sendError(res, error);
  }
};