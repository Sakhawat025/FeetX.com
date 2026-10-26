const prisma = require("../config/prisma");

const ACTIVE = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"];
const WAITING = ["PENDING", "CONFIRMED"];
const GPS_MAX_AGE = 120000;
const GPS_MAX_ACCURACY = 200;

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function positiveId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    fail(400, "Invalid ID.");
  }

  return id;
}

function handleError(res, error) {
  if (error.code === "P2034") {
    return res.status(409).json({
      message: "Fleet data changed during assignment. Refresh and try again.",
    });
  }

  if (!error.status) console.error("Smart dispatch:", error);

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : "Unable to process smart dispatch.",
  });
}

async function requireAdmin(db, req) {
  const admin = await db.user.findFirst({
    where: {
      id: req.user.id,
      role: "ADMIN",
      status: true,
    },
    select: { id: true },
  });

  if (!admin) fail(403, "Admin account unavailable.");
}

function coordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function freshLocation(location) {
  if (
    !location?.sessionId ||
    !location.capturedAt ||
    !coordinates(location.latitude, location.longitude)
  ) {
    return null;
  }

  const age = Date.now() - new Date(location.capturedAt).getTime();

  if (
    age < -10000 ||
    age > GPS_MAX_AGE ||
    !Number.isFinite(location.accuracy) ||
    location.accuracy < 0 ||
    location.accuracy > GPS_MAX_ACCURACY
  ) {
    return null;
  }

  // Never expose the location session ID.
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    capturedAt: location.capturedAt,
  };
}

function distanceKm(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180;

  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLng = radians(b.longitude - a.longitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

const parcelSelect = {
  id: true,
  trackingId: true,
  parcelType: true,
  parcelWeight: true,
  priority: true,
  pickupAddress: true,
  deliveryAddress: true,
  pickupLatitude: true,
  pickupLongitude: true,
  createdAt: true,
};

async function recommendations(db, parcel) {
  if (
    !coordinates(parcel.pickupLatitude, parcel.pickupLongitude)
  ) {
    return {
      riders: [],
      excluded: [],
      blocker: "This parcel needs valid pickup coordinates before dispatch.",
    };
  }

  if (
    !Number.isFinite(parcel.parcelWeight) ||
    parcel.parcelWeight <= 0
  ) {
    return {
      riders: [],
      excluded: [],
      blocker: "This parcel needs a valid weight before capacity can be checked.",
    };
  }

  const users = await db.user.findMany({
    where: { role: "RIDER" },
    select: {
      id: true,
      name: true,
      zone: true,
      status: true,
      isAvailable: true,
      riderLocation: true,
      assignedVehicle: {
        select: {
          id: true,
          name: true,
          status: true,
          capacityKg: true,
        },
      },
      riderDeliveries: {
        where: { status: { in: ACTIVE } },
        select: {
          id: true,
          parcelWeight: true,
        },
      },
    },
  });

  const ratings = await db.delivery.groupBy({
    by: ["riderId"],
    where: {
      riderId: { not: null },
      status: "DELIVERED",
      rating: { not: null },
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingMap = new Map(
    ratings.map((item) => [item.riderId, item])
  );

  const pickup = {
    latitude: parcel.pickupLatitude,
    longitude: parcel.pickupLongitude,
  };

  const riders = [];
  const excluded = [];

  for (const user of users) {
    const vehicle = user.assignedVehicle;
    const jobs = user.riderDeliveries;
    const location = freshLocation(user.riderLocation);

    let reason = "";

    if (!user.status) reason = "Account disabled";
    else if (!user.isAvailable) reason = "Not available for assignments";
    else if (!vehicle) reason = "No vehicle assigned";
    else if (vehicle.status === "MAINTENANCE") {
      reason = "Vehicle is in maintenance";
    } else if (
      !Number.isFinite(vehicle.capacityKg) ||
      vehicle.capacityKg <= 0
    ) {
      reason = "Vehicle capacity is invalid";
    } else if (!location) {
      reason = "Fresh GPS with accuracy within 200 m is required";
    } else if (
      jobs.some(
        (job) =>
          !Number.isFinite(job.parcelWeight) ||
          job.parcelWeight <= 0
      )
    ) {
      reason = "An active parcel has unknown weight";
    }

    const reservedKg = jobs.reduce(
      (sum, job) => sum + (job.parcelWeight || 0),
      0
    );

    if (
      !reason &&
      reservedKg + parcel.parcelWeight > vehicle.capacityKg + 0.000001
    ) {
      reason = "Insufficient remaining vehicle capacity";
    }

    if (reason) {
      excluded.push({ id: user.id, name: user.name, reason });
      continue;
    }

    const distance = distanceKm(location, pickup);
    const ratingRow = ratingMap.get(user.id);
    const rating = ratingRow?._avg.rating ?? null;
    const reviewCount = ratingRow?._count.rating ?? 0;

    // Smooth ratings toward 3/5 until enough reviews exist.
    const adjustedRating =
      ((rating || 0) * reviewCount + 3 * 5) / (reviewCount + 5);

    const proximity = 1 / (1 + distance / 5);
    const workload = 1 / (1 + jobs.length);
    const performance = adjustedRating / 5;

    // Express gives greater weight to proximity.
    const weights =
      parcel.priority === "EXPRESS"
        ? [0.65, 0.25, 0.1]
        : [0.5, 0.35, 0.15];

    const score =
      100 *
      (
        proximity * weights[0] +
        workload * weights[1] +
        performance * weights[2]
      );

    riders.push({
      id: user.id,
      name: user.name,
      zone: user.zone,
      vehicleName: vehicle.name,
      capacityKg: vehicle.capacityKg,
      reservedKg,
      remainingKg: vehicle.capacityKg - reservedKg,
      workload: jobs.length,
      rating,
      reviewCount,
      location,
      distanceKm: distance,
      score: Math.round(score),
    });
  }

  riders.sort(
    (a, b) =>
      b.score - a.score ||
      a.distanceKm - b.distanceKm ||
      a.id - b.id
  );

  return { riders, excluded, blocker: null };
}

exports.getDispatch = async (req, res) => {
  try {
    const selectedId =
      req.query.deliveryId === undefined
        ? null
        : positiveId(req.query.deliveryId);

    const result = await prisma.$transaction(
      async (tx) => {
        await requireAdmin(tx, req);

        const requests = await tx.delivery.findMany({
          where: {
            riderId: null,
            status: { in: WAITING },
          },
          select: parcelSelect,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });

        // Express first; preserve oldest-first order within each group.
        requests.sort(
          (a, b) =>
            Number(b.priority === "EXPRESS") -
            Number(a.priority === "EXPRESS")
        );

        const parcel =
          requests.find((item) => item.id === selectedId) ||
          requests[0] ||
          null;

        const ranked = parcel
          ? await recommendations(tx, parcel)
          : { riders: [], excluded: [], blocker: null };

        return {
          requests,
          parcel,
          ...ranked,
          refreshedAt: new Date().toISOString(),
        };
      },
      {
        isolationLevel: "RepeatableRead",
        timeout: 15000,
      }
    );

    res.set("Cache-Control", "no-store");
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.assignRider = async (req, res) => {
  try {
    const deliveryId = positiveId(req.body.deliveryId);
    const riderId = positiveId(req.body.riderId);

    await prisma.$transaction(
      async (tx) => {
        await requireAdmin(tx, req);

        // Fetch the delivery package to verify it exists and is unassigned
        const parcel = await tx.delivery.findUnique({
          where: { id: deliveryId },
          select: {
            ...parcelSelect,
            status: true,
            riderId: true,
          },
        });

        if (!parcel) {
          fail(404, "Parcel not found.");
        }

        if (parcel.riderId !== null || !WAITING.includes(parcel.status)) {
          fail(400, "Parcel is already assigned or processed.");
        }

        // Fetch recommendations to validate if the rider is eligible
        const { riders } = await recommendations(tx, parcel);
        const eligibleRider = riders.find((r) => r.id === riderId);

        if (!eligibleRider) {
          fail(422, "Rider is ineligible or capacity limits exceeded.");
        }

        // Apply changes
        await tx.delivery.update({
          where: { id: deliveryId },
          data: {
            riderId: riderId,
            status: "CONFIRMED", // Moves parcel safely within system bounds
          },
        });
      },
      {
        isolationLevel: "RepeatableRead",
        timeout: 15000,
      }
    );

    res.json({ success: true, message: "Rider successfully assigned." });
  } catch (error) {
    handleError(res, error);
  }
};
