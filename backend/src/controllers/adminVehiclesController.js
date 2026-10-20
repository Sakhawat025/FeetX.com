const prisma = require("../config/prisma");

const VEHICLE_INCLUDE = {
  rider: {
    select: {
      id: true,
      name: true,
    },
  },
};

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function handleError(res, error) {
  if (error.code === "P2002") {
    return res.status(409).json({
      message: "Plate number already exists or rider already has a vehicle.",
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ message: "Vehicle not found." });
  }

  if (error.code === "P2034") {
    return res.status(409).json({
      message: "Another update occurred. Please try again.",
    });
  }

  if (!error.status) {
    console.error("Vehicles error:", error);
  }

  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Unable to process the vehicle request.",
  });
}

async function requireAdmin(req) {
  const user = await prisma.user.findFirst({
    where: {
      id: req.user.id,
      role: "ADMIN",
      status: true,
    },
    select: { id: true },
  });

  if (!user) {
    fail(403, "Admin account unavailable.");
  }
}

function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "Invalid vehicle details.");
  }

  const allowed = [
    "name",
    "plateNumber",
    "type",
    "capacityKg",
    "fuelPercent",
    "lastServicedAt",
    "status",
    "riderId",
  ];

  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    fail(400, "Unsupported vehicle field.");
  }

  const data = {};

  for (const [key, limit] of [
    ["name", 100],
    ["plateNumber", 40],
    ["type", 30],
  ]) {
    if (
      typeof body[key] !== "string" ||
      !body[key].trim() ||
      body[key].trim().length > limit
    ) {
      fail(400, `Enter a valid ${key}.`);
    }

    data[key] = body[key].trim();
  }

  data.plateNumber = data.plateNumber.toUpperCase();

  if (!["Motorbike", "Van", "Truck", "Car", "Bicycle"].includes(data.type)) {
    fail(400, "Invalid vehicle type.");
  }

  if (
    typeof body.capacityKg !== "number" ||
    !Number.isFinite(body.capacityKg) ||
    body.capacityKg <= 0 ||
    body.capacityKg > 100000
  ) {
    fail(400, "Capacity must be above 0 and at most 100000 kg.");
  }

  data.capacityKg = body.capacityKg;

  if (
    body.fuelPercent !== null &&
    (!Number.isInteger(body.fuelPercent) ||
      body.fuelPercent < 0 ||
      body.fuelPercent > 100)
  ) {
    fail(400, "Fuel must be a whole number from 0 to 100.");
  }

  data.fuelPercent = body.fuelPercent;

  if (!["ACTIVE", "IDLE", "MAINTENANCE"].includes(body.status)) {
    fail(400, "Invalid vehicle status.");
  }

  data.status = body.status;

  if (
    body.riderId !== null &&
    (!Number.isSafeInteger(body.riderId) || body.riderId <= 0)
  ) {
    fail(400, "Invalid rider.");
  }

  data.riderId = body.riderId;

  if (body.lastServicedAt === null || body.lastServicedAt === "") {
    data.lastServicedAt = null;
  } else {
    const value = body.lastServicedAt;

    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      fail(400, "Invalid service date.");
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      fail(400, "Invalid service date.");
    }

    // Current calendar date in Bangladesh.
    const today = new Date(Date.now() + 6 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (value > today) {
      fail(400, "Last serviced date cannot be in the future.");
    }

    data.lastServicedAt = date;
  }

  return data;
}

exports.listVehicles = async (req, res) => {
  try {
    await requireAdmin(req);

    const [vehicles, riders] = await Promise.all([
      prisma.vehicle.findMany({
        include: VEHICLE_INCLUDE,
        orderBy: { id: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "RIDER" },
        select: {
          id: true,
          name: true,
          status: true,
          assignedVehicle: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    res.set("Cache-Control", "no-store");
    return res.json({ vehicles, riders });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.saveVehicle = async (req, res) => {
  try {
    await requireAdmin(req);

    const editing = req.params.id !== undefined;
    const id = editing ? Number(req.params.id) : null;

    if (editing && (!Number.isSafeInteger(id) || id <= 0)) {
      fail(400, "Invalid vehicle ID.");
    }

    const data = validate(req.body);

    const vehicle = await prisma.$transaction(
      async (tx) => {
        const previous = editing
          ? await tx.vehicle.findUnique({ where: { id } })
          : null;

        if (editing && !previous) {
          fail(404, "Vehicle not found.");
        }

        if (data.riderId !== null) {
          const rider = await tx.user.findFirst({
            where: { id: data.riderId, role: "RIDER" },
            select: { id: true, status: true },
          });

          if (!rider) {
            fail(400, "Selected rider does not exist.");
          }

          if (!rider.status && previous?.riderId !== data.riderId) {
            fail(400, "Cannot assign a disabled rider.");
          }

          const assigned = await tx.vehicle.findUnique({
            where: { riderId: data.riderId },
          });

          if (assigned && assigned.id !== id) {
            fail(409, "This rider already has another vehicle.");
          }
        }

        const saved = editing
          ? await tx.vehicle.update({ where: { id }, data, include: VEHICLE_INCLUDE })
          : await tx.vehicle.create({ data, include: VEHICLE_INCLUDE });

        // Keep the existing rider profile vehicle fields in sync.
        if (previous?.riderId && previous.riderId !== saved.riderId) {
          await tx.user.update({
            where: { id: previous.riderId },
            data: {
              vehicleName: null,
              plateNumber: null,
              vehicleId: null,
            },
          });
        }

        if (saved.riderId) {
          await tx.user.update({
            where: { id: saved.riderId },
            data: {
              vehicleName: saved.name,
              plateNumber: saved.plateNumber,
              vehicleId: `VEH-${String(saved.id).padStart(3, "0")}`,
            },
          });
        }

        return saved;
      },
      { isolationLevel: "Serializable" }
    );

    return res.status(editing ? 200 : 201).json(vehicle);
  } catch (error) {
    return handleError(res, error);
  }
};