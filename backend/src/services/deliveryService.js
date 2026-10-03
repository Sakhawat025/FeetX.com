const prisma = require("../config/prisma");

// Create new delivery
const createDelivery = async (data, customerId) => {
    const trackingId = "FTX-" + Date.now();

    const delivery = await prisma.delivery.create({
        data: {
            trackingId,
            senderName: data.senderName,
            receiverName: data.receiverName,
            receiverPhone: data.receiverPhone,
            pickupAddress: data.pickupAddress,
            deliveryAddress: data.deliveryAddress,
            parcelType: data.parcelType,
            parcelWeight: data.parcelWeight,
            customerId
        }
    });

    return delivery;
};

// Get customer deliveries
const getCustomerDeliveries = async (customerId) => {
    const deliveries = await prisma.delivery.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" }
    });

    return deliveries;
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
