const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const createRider = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const rider = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: "RIDER"
            }
        });

        const { password: removePassword, ...safeRider } = rider;

        res.status(201).json({
            message: "Rider created successfully",
            rider: safeRider
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.createRider = createRider;
