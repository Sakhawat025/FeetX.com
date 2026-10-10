const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const registerCustomer = async (data) => {
    const { name, email, phone, password } = data;

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const safeUser = await prisma.user.create({
        data: {
            name,
            email,
            phone,
            password: hashedPassword,
            role: "CUSTOMER"
        }
    });

    return safeUser;
};

const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    const { password:removePassword, ...safeUser } = user;
    return { user:safeUser, token };
};

const updateCustomerProfile = async (userId, data) => {
  const { name, phone } = data;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name, phone },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true
    }
  });
  return updatedUser;
};



module.exports = {
    registerCustomer,
    loginUser,
    updateCustomerProfile
};
