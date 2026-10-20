const prisma = require("../config/prisma");

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  vehicleName: true,
  plateNumber: true,
  vehicleId: true,
  zone: true,
};

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function sendError(res, error) {
  if (error.code === "P2002") {
    return res.status(409).json({ message: "This email is already in use." });
  }

  if (!error.status) console.error("Rider profile:", error);

  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Unable to process this request.",
  });
}

async function requireUser(id, role) {
  const user = await prisma.user.findFirst({
    where: { id, role, status: true },
    select: { id: true },
  });

  if (!user) fail(403, "Account unavailable.");
}

// Calendar month starts in Bangladesh time.
function currentMonthStart() {
  const local = new Date(Date.now() + 6 * 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - 6 * 60 * 60 * 1000);
}

exports.getProfile = async (req, res) => {
  try {
    await requireUser(req.user.id, "RIDER");

    const riderId = req.user.id;
    const completedWhere = { riderId, status: "DELIVERED" };

    const [
      profile,
      totalDeliveries,
      thisMonth,
      timedDeliveries,
      rating,
      feedback,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: riderId }, select: profileSelect }),
      prisma.delivery.count({ where: completedWhere }),
      prisma.delivery.count({
        where: { ...completedWhere, deliveredAt: { gte: currentMonthStart() } },
      }),
      prisma.delivery.findMany({
        where: { ...completedWhere, dueAt: { not: null }, deliveredAt: { not: null } },
        select: { dueAt: true, deliveredAt: true },
      }),
      prisma.delivery.aggregate({
        where: { ...completedWhere, rating: { not: null } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.delivery.findMany({
        where: { ...completedWhere, rating: { not: null } },
        select: {
          id: true,
          rating: true,
          feedback: true,
          reviewedAt: true,
          customer: { select: { name: true } },
        },
        orderBy: { reviewedAt: "desc" },
        take: 5,
      }),
    ]);

    const onTime = timedDeliveries.filter((delivery) => delivery.deliveredAt <= delivery.dueAt).length;

    res.set("Cache-Control", "no-store");
    res.json({
      profile,
      stats: {
        totalDeliveries,
        thisMonth,
        rating: rating._avg.rating,
        reviewCount: rating._count.rating,
        onTimeRate: timedDeliveries.length ? Math.round((onTime / timedDeliveries.length) * 100) : null,
        timedDeliveryCount: timedDeliveries.length,
      },
      feedback,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    await requireUser(req.user.id, "RIDER");

    const limits = {
      name: 100,
      email: 254,
      phone: 25,
      vehicleName: 100,
      plateNumber: 40,
      vehicleId: 40,
      zone: 100,
    };

    const body = req.body || {};
    const keys = Object.keys(body);

    if (!keys.length) fail(400, "No changes supplied.");

    const data = {};

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(limits, key)) fail(400, `You cannot update ${key}.`);
      if (typeof body[key] !== "string") fail(400, `Invalid ${key}.`);

      const value = body[key].trim();

      if (value.length > limits[key]) fail(400, `${key} is too long.`);
      if (["name", "email"].includes(key) && !value) fail(400, `${key} is required.`);
      if (key === "email") {
        const email = value.toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) fail(400, "Enter a valid email.");
        data.email = email;
        continue;
      }


      data[key] = key === "email" ? value.toLowerCase() : value || null;
    }

    const profile = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: profileSelect,
    });

    res.json(profile);
  } catch (error) {
    sendError(res, error);
  }
};

exports.saveFeedback = async (req, res) => {
  try {
    await requireUser(req.user.id, "CUSTOMER");

    const id = Number(req.params.id);
    const { rating, feedback = "" } = req.body || {};

    if (!Number.isSafeInteger(id) || id <= 0) fail(400, "Invalid delivery.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, "Rating must be between 1 and 5.");
    if (typeof feedback !== "string" || feedback.trim().length > 1000) fail(400, "Feedback must be within 1000 characters.");

    const result = await prisma.delivery.updateMany({
      where: { id, customerId: req.user.id, riderId: { not: null }, status: "DELIVERED" },
      data: {
        rating,
        feedback: feedback.trim() || null,
        reviewedAt: new Date(),
      },
    });

    if (result.count !== 1) fail(404, "Your completed delivery was not found.");

    res.json({ saved: true });
  } catch (error) {
    sendError(res, error);
  }
};
