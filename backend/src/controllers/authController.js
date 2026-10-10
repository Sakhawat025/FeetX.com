const authService = require("../services/authService");
const prisma = require("../config/prisma");

const register = async (req, res) => {
    try {
        const user = await authService.registerCustomer(req.body);
        res.status(201).json({
            message: "Customer registered successfully",
            user
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true
            }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedUser = await authService.updateCustomerProfile(userId, req.body);
        res.json(updatedUser);
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};


module.exports = {
    register,
    login,
    getMe,
    updateProfile
};
