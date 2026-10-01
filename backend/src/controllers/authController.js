const authService = require("../services/authService");

const register = async (req, res) => {
    try {
        const user = await authService.registerCustomer(req.body);

        res.status(201).json({
            message: "Customer registered successfully",
            user
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        res.json(result);
    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};

module.exports = {
    register,
    login
};
