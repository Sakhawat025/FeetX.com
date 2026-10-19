const prisma = require("../config/prisma");

// Create new delivery
const createDelivery = async (data, customerId) => {
  const coordinates = {
    pickupLatitude: data.pickupLatitude,
    pickupLongitude: data.pickupLongitude,
    deliveryLatitude: data.deliveryLatitude,
    deliveryLongitude: data.deliveryLongitude,
  };

  for (const [field, value] of Object.entries(coordinates)) {
    const limit = field.endsWith("Latitude") ? 90 : 180;

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < -limit ||
      value > limit
    ) {
      throw new Error(
        "Please select valid pickup and delivery locations on the map."
      );
    }
  }

  const requiredFields = [
    "senderName",
    "receiverName",
    "pickupAddress",
    "deliveryAddress",
    "parcelType",
  ];

  for (const field of requiredFields) {
    if (
      typeof data[field] !== "string" ||
      !data[field].trim()
    ) {
      throw new Error("Please fill in all required fields.");
    }
  }

  if (
    data.parcelWeight != null &&
    (!Number.isFinite(data.parcelWeight) || data.parcelWeight < 0)
  ) {
    throw new Error("Please enter a valid parcel weight.");
  }

  const trackingId = `FTX-${require("crypto").randomUUID()}`;

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.create({
      data: {
        trackingId,
        senderName: data.senderName.trim(),
        receiverName: data.receiverName.trim(),
        receiverPhone: data.receiverPhone || null,
        pickupAddress: data.pickupAddress.trim(),
        deliveryAddress: data.deliveryAddress.trim(),
        parcelType: data.parcelType,
        parcelWeight: data.parcelWeight ?? null,
        ...coordinates,
        customerId,
      },
    });

    await tx.notification.create({
      data: {
        userId: customerId,
        title: "Delivery Created",
        message:
          `Your parcel ${delivery.trackingId} has been successfully created.`,
        type: "DELIVERY",
      },
    });

    return delivery;
  });
};


// Get customer deliveries
const getCustomerDeliveries = async (customerId) => {
  return prisma.delivery.findMany({
    where: {
      customerId,
    },
    include: {
      rider: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Get customer dashboard data
const getCustomerDashboard = async (customerId) => {
  const [activeCount, deliveredCount, pendingCount, recentDeliveries] = await Promise.all([
    prisma.delivery.count({
      where: {
        customerId,
        status: { in: ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      },
    }),
    prisma.delivery.count({
      where: {
        customerId,
        status: "DELIVERED",
      },
    }),
    prisma.delivery.count({
      where: {
        customerId,
        status: "PENDING",
      },
    }),
    prisma.delivery.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      active: activeCount,
      delivered: deliveredCount,
      pending: pendingCount,
    },
    recentDeliveries,
  };
};


module.exports = {
    createDelivery,
    getCustomerDeliveries,
    getCustomerDashboard
};
