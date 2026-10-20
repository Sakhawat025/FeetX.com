const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const ACTIVE_DELIVERIES = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"];

const RIDER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  vehicleName: true,
  plateNumber: true,
  vehicleId: true,
  zone: true,
};

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function handleError(res, error) {
  if (error.code === "P2002") {
    return res.status(409).json({
      message: "This email is already in use.",
    });
  }

  if (!error.status) {
    console.error("Admin riders error:", error);
  }

  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Unable to process the rider request.",
  });
}

async function requireAdmin(req) {
  const admin = await prisma.user.findFirst({
    where: {
      id: req.user.id,
      role: "ADMIN",
      status: true,
    },
    select: { id: true },
  });

  if (!admin) {
    fail(403, "Admin account unavailable.");
  }
}

function validate(body, creating) {
  const limits = {
    name: 100,
    email: 254,
    phone: 25,
    vehicleName: 100,
    plateNumber: 40,
    vehicleId: 40,
    zone: 100,
  };

  const data = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "Invalid rider details.");
  }

  for (const key of Object.keys(body)) {
    if (!(key in limits) && !["password", "status"].includes(key)) {
      fail(400, `Unsupported field: ${key}`);
    }
  }

  for (const [key, limit] of Object.entries(limits)) {
    if (body[key] === undefined) continue;

    if (typeof body[key] !== "string") {
      fail(400, `Invalid ${key}.`);
    }

    const value = body[key].trim();

    if (value.length > limit) {
      fail(400, `${key} must be within ${limit} characters.`);
    }

    if (["name", "email"].includes(key) && !value) {
      fail(400, `${key} is required.`);
    }

    data[key] = value || null;
  }

  if (creating && (!data.name || !data.email)) {
    fail(400, "Name and email are required.");
  }

  if (data.email) {
    data.email = data.email.toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      fail(400, "Enter a valid email address.");
    }
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "boolean") {
      fail(400, "Invalid account availability.");
    }

    data.status = body.status;
  }

  if (body.password !== undefined) {
    if (typeof body.password !== "string") {
      fail(400, "Invalid password.");
    }

    if (
      body.password &&
      (body.password.length < 8 ||
        Buffer.byteLength(body.password, "utf8") > 72)
    ) {
      fail(400, "Password must be at least 8 characters and at most 72 bytes.");
    }
  }

  if (creating && !body.password) {
    fail(400, "Password is required.");
  }

  return data;
}

exports.listRiders = async (req, res) => {
  try {
    await requireAdmin(req);

    const [riders, workloads, ratings] = await Promise.all([
      prisma.user.findMany({
        where: { role: "RIDER" },
        select: RIDER_FIELDS,
        orderBy: { id: "asc" },
      }),
      prisma.delivery.groupBy({
        by: ["riderId"],
        where: {
          riderId: { not: null },
          status: { in: ACTIVE_DELIVERIES },
        },
        _count: { _all: true },
      }),
      prisma.delivery.groupBy({
        by: ["riderId"],
        where: {
          riderId: { not: null },
          status: "DELIVERED",
          rating: { not: null },
        },
        _avg: { rating: true },
      }),
    ]);

    const workloadMap = new Map(
      workloads.map((item) => [item.riderId, item._count._all])
    );

    const ratingMap = new Map(
      ratings.map((item) => [item.riderId, item._avg.rating])
    );

    res.set("Cache-Control", "no-store");

    return res.json(
      riders.map((rider) => {
        const workload = workloadMap.get(rider.id) || 0;

        return {
          ...rider,
          riderCode: `RDR-${String(rider.id).padStart(3, "0")}`,
          workload,
          rating: ratingMap.get(rider.id) ?? null,
          availability: !rider.status
            ? "Offline"
            : workload > 0
            ? "On Delivery"
            : "Available",
        };
      })
    );
  } catch (error) {
    return handleError(res, error);
  }
};

exports.createRider = async (req, res) => {
  try {
    await requireAdmin(req);

    const data = validate(req.body, true);
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const rider = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: "RIDER",
      },
      select: RIDER_FIELDS,
    });

    return res.status(201).json(rider);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateRider = async (req, res) => {
  try {
    await requireAdmin(req);

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      fail(400, "Invalid rider ID.");
    }

    const data = validate(req.body, false);

    if (req.body.password) {
      data.password = await bcrypt.hash(req.body.password, 12);
    }

    if (!Object.keys(data).length) {
      fail(400, "No changes supplied.");
    }

    // The role condition prevents editing customer/admin accounts.
    const result = await prisma.user.updateMany({
      where: { id, role: "RIDER" },
      data,
    });

    if (!result.count) {
      fail(404, "Rider not found.");
    }

    return res.json({ message: "Rider updated successfully." });
  } catch (error) {
    return handleError(res, error);
  }
};