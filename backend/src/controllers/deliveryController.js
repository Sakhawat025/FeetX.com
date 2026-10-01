const deliveryService = require("../services/deliveryService");

// Create Delivery
const createDelivery = async (req, res) => {
    try {
        const customerId = req.user.id;

        const delivery = await deliveryService.createDelivery(req.body, customerId);

        res.status(201).json({
            message: "Delivery created successfully",
            delivery
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// Get Customer Deliveries
const getMyDeliveries = async (req, res) => {
    try {
        const customerId = req.user.id;

        const deliveries = await deliveryService.getCustomerDeliveries(customerId);

        res.json(deliveries);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createDelivery,
    getMyDeliveries
};
