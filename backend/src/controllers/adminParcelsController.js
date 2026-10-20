const prisma = require("../config/prisma");

const PARCEL_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

const PARCEL_SELECT = {
  id: true,
  trackingId: true,
  senderName: true,
  receiverName: true,
  receiverPhone: true,
  pickupAddress: true,
  deliveryAddress: true,
  parcelType: true,
  parcelWeight: true,
  priority: true,
  status: true,
  createdAt: true,
  assignedAt: true,
  dueAt: true,
  deliveredAt: true,
  rider: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
};

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function handleError(res, error) {
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Parcel not found." });
  }

  if (!error.status) {
    console.error("Admin parcels error:", error);
  }

  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Unable to process the parcel request.",
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

function parcelId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    fail(400, "Invalid parcel ID.");
  }

  return id;
}

exports.listParcels = async (req, res) => {
  try {
    await requireAdmin(req);

    const {
      search = "",
      status = "",
      priority = "",
      assignment = "",
      page = "1",
    } = req.query;

    if (
      [search, status, priority, assignment, page].some(
        (value) => typeof value !== "string"
      )
    ) {
      fail(400, "Invalid filters.");
    }

    const currentPage = Number(page);
    const pageSize = 20;

    if (
      !Number.isSafeInteger(currentPage) ||
      currentPage < 1 ||
      currentPage > 100000
    ) {
      fail(400, "Invalid page.");
    }

    if (search.length > 150) {
      fail(400, "Search is too long.");
    }

    if (status && !PARCEL_STATUSES.includes(status)) {
      fail(400, "Invalid status.");
    }

    if (priority && !["STANDARD", "EXPRESS", "UNSET"].includes(priority)) {
      fail(400, "Invalid priority.");
    }

    if (assignment && !["ASSIGNED", "UNASSIGNED"].includes(assignment)) {
      fail(400, "Invalid assignment filter.");
    }

    const where = {};
    const term = search.trim().replace(/^#/, "");

    if (term) {
      where.OR = [
        { trackingId: { contains: term, mode: "insensitive" } },
        { receiverName: { contains: term, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority === "UNSET" ? null : priority;
    }

    if (assignment === "ASSIGNED") {
      where.riderId = { not: null };
    }
    
    if (assignment === "UNASSIGNED") {
      where.riderId = null;
    }

    const [total, parcels] = await prisma.$transaction(
      [
        prisma.delivery.count({ where }),
        prisma.delivery.findMany({
          where,
          select: PARCEL_SELECT,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        }),
      ],
      { isolationLevel: "RepeatableRead" }
    );

    res.set("Cache-Control", "no-store");

    return res.json({
      parcels,
      total,
      page: currentPage,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getParcel = async (req, res) => {
  try {
    await requireAdmin(req);

    const parcel = await prisma.delivery.findUnique({
      where: { id: parcelId(req.params.id) },
      select: PARCEL_SELECT,
    });

    if (!parcel) {
      fail(404, "Parcel not found.");
    }

    res.set("Cache-Control", "no-store");
    return res.json(parcel);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updatePriority = async (req, res) => {
  try {
    await requireAdmin(req);

    const { priority } = req.body || {};

    if (![null, "STANDARD", "EXPRESS"].includes(priority)) {
      fail(400, "Invalid priority.");
    }

    const parcel = await prisma.delivery.update({
      where: { id: parcelId(req.params.id) },
      data: { priority },
      select: PARCEL_SELECT,
    });

    return res.json(parcel);
  } catch (error) {
    return handleError(res, error);
  }
};