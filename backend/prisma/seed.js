const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("Admin@12345", 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@feetx.com" },
        update: {},
        create: {
            name: "System Admin",
            email: "admin@feetx.com",
            phone: "01718050895",
            password,
            role: "ADMIN"
        }
    });

    console.log("Admin created:", admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
