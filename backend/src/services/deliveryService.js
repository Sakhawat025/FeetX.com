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

module.exports = {
    createDelivery,
    getCustomerDeliveries
};
