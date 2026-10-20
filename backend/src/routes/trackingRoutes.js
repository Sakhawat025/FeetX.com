const express = require("express");
const { randomUUID } = require("crypto");

const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const ACTIVE = [
  "CONFIRMED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
];

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (!error.status) {
        console.error("Tracking error:", error);
      }

      res.status(error.status || 500).json({
        message: error.status
          ? error.message
          : "Unable to process location request",
      });
    }
  };
}

function requireRole(req, role) {
  if (req.trackingUser.role !== role) {
    fail(403, "Access denied");
  }
}

function validId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    fail(400, "Invalid delivery ID");
  }

  return id;
}

function hasSession(value) {
  return typeof value === "string" && value.length === 36;
}

// Never return session IDs to customers or admins.
function publicLocation(location) {
  if (
    !location?.sessionId ||
    location.latitude == null ||
    location.longitude == null ||
    !location.capturedAt
  ) {
    return null;
  }

  const age = Date.now() - new Date(location.capturedAt).getTime();

  // Expired coordinates are no longer exposed.
  if (age > 120000) return null;

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    capturedAt: location.capturedAt,
  };
}

router.use(authMiddleware);

// Check current account state, not just the JWT role.
router.use(async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user || !user.status) {
      return res.status(403).json({
        message: "Account unavailable",
      });
    }

    req.trackingUser = user;

    // Location responses should not be stored in browser caches.
    res.set("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Tracking authentication error:", error);
    res.status(500).json({
      message: "Unable to verify account",
    });
  }
});

// RIDER: Explicitly start a new sharing session.
router.post("/session", handle(async (req, res) => {
  requireRole(req, "RIDER");

  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      riderId: req.user.id,
      status: { in: ACTIVE },
    },
    select: { id: true },
  });

  if (!activeDelivery) {
    fail(409, "You have no active assigned deliveries");
  }

  const sessionId = randomUUID();

  const data = {
    sessionId,
    latitude: null,
    longitude: null,
    accuracy: null,
    capturedAt: null,
  };

  await prisma.riderLocation.upsert({
    where: { riderId: req.user.id },
    create: {
      riderId: req.user.id,
      ...data,
    },
    update: data,
  });

  res.json({ sessionId });
}));

// RIDER: Stop only the matching session.
// An old tab cannot stop a newer session.
router.delete("/session", handle(async (req, res) => {
  requireRole(req, "RIDER");

  const { sessionId } = req.body || {};

  if (!hasSession(sessionId)) {
    fail(400, "Invalid location session");
  }

  await prisma.riderLocation.updateMany({
    where: {
      riderId: req.user.id,
      sessionId,
    },
    data: {
      sessionId: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      capturedAt: null,
    },
  });

  res.json({ stopped: true });
}));

// RIDER: Save a fresh GPS sample.
router.put("/location", handle(async (req, res) => {
  requireRole(req, "RIDER");

  const {
    sessionId,
    latitude,
    longitude,
    accuracy,
    capturedAt,
  } = req.body || {};

  if (
    !hasSession(sessionId) ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    !Number.isFinite(capturedAt)
  ) {
    fail(400, "Invalid GPS coordinates");
  }

  const age = Date.now() - capturedAt;

  if (age < -10000 || age > 60000) {
    fail(400, "GPS reading is outdated. Check your device clock.");
  }

  const sampleTime = new Date(capturedAt);

  const result = await prisma.riderLocation.updateMany({
    where: {
      riderId: req.user.id,
      sessionId,
      rider: {
        is: {
          role: "RIDER",
          status: true,
          riderDeliveries: {
            some: {
              status: { in: ACTIVE },
            },
          },
        },
      },
      OR: [
        { capturedAt: null },
        { capturedAt: { lt: sampleTime } },
      ],
    },
    data: {
      latitude,
      longitude,
      accuracy,
      capturedAt: sampleTime,
    },
  });

  if (result.count !== 1) {
    fail(
      409,
      "Sharing session ended, GPS sample was repeated, or no active delivery remains"
    );
  }

  res.json({ saved: true });
}));

// CUSTOMER: Only the customer's own parcel.
router.get("/delivery/:id", handle(async (req, res) => {
  requireRole(req, "CUSTOMER");

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: validId(req.params.id),
      customerId: req.user.id,
    },
    select: {
      id: true,
      status: true,
      rider: {
        select: {
          id: true,
          name: true,
          status: true,
          riderLocation: true,
        },
      },
    },
  });

  if (!delivery) {
    fail(404, "Parcel not found");
  }

  if (!ACTIVE.includes(delivery.status)) {
    return res.json({
      riders: [],
      message: delivery.status === "PENDING"
        ? "Waiting for rider assignment."
        : "Live tracking has ended for this parcel.",
    });
  }

  if (!delivery.rider || !delivery.rider.status) {
    return res.json({
      riders: [],
      message: "Rider location is unavailable.",
    });
  }

  const location = publicLocation(
    delivery.rider.riderLocation
  );

  res.json({
    riders: location
      ? [{
          id: delivery.rider.id,
          name: delivery.rider.name,
          ...location,
        }]
      : [],
    message: location
      ? ""
      : "Waiting for a fresh location from your rider.",
  });
}));

// ADMIN: Active riders with active deliveries.
router.get("/fleet", handle(async (req, res) => {
  requireRole(req, "ADMIN");

  const riders = await prisma.user.findMany({
    where: {
      role: "RIDER",
      status: true,
      riderDeliveries: {
        some: {
          status: { in: ACTIVE },
        },
      },
    },
    select: {
      id: true,
      name: true,
      riderLocation: true,
    },
  });

  const visible = riders.flatMap((rider) => {
    const location = publicLocation(rider.riderLocation);

    return location
      ? [{ id: rider.id, name: rider.name, ...location }]
      : [];
  });

  res.json({
    riders: visible,
    message: visible.length
      ? ""
      : "No riders are sharing a recent location.",
  });
}));

// Road route cache: shared between customer and rider requests.
const roadCache = new Map();

function coordinatePoint(latitude, longitude) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

async function loadJourney(req) {
  const user = req.trackingUser;

  if (!["CUSTOMER", "RIDER"].includes(user.role)) {
    fail(403, "Access denied");
  }

  const ownership =
    user.role === "CUSTOMER"
      ? { customerId: user.id }
      : { riderId: user.id };

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: validId(req.params.id),
      ...ownership,
    },
    select: {
      id: true,
      trackingId: true,
      status: true,
      pickupAddress: true,
      deliveryAddress: true,
      pickupLatitude: true,
      pickupLongitude: true,
      deliveryLatitude: true,
      deliveryLongitude: true,
      rider: {
        select: {
          id: true,
          name: true,
          status: true,
          riderLocation: true,
        },
      },
    },
  });

  if (!delivery) {
    fail(404, "Parcel not found");
  }

  const pickup = coordinatePoint(
    delivery.pickupLatitude,
    delivery.pickupLongitude
  );

  const destination = coordinatePoint(
    delivery.deliveryLatitude,
    delivery.deliveryLongitude
  );

  const active = ACTIVE.includes(delivery.status);

  const location =
    active && delivery.rider?.status
      ? publicLocation(delivery.rider.riderLocation)
      : null;

  const rider = location
    ? {
        id: delivery.rider.id,
        name: delivery.rider.name,
        ...location,
      }
    : null;

  const ended = [
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ].includes(delivery.status);

  let mode = "preview";
  let label = "Pickup to delivery — route preview";
  let start = pickup;
  let end = destination;

  if (ended) {
    mode = "ended";
    label = "Live tracking has ended";
    start = null;
    end = null;
  } else if (rider && delivery.status === "CONFIRMED") {
    mode = "pickup";
    label = "Rider to pickup";
    start = rider;
    end = pickup;
  } else if (rider && active) {
    mode = "delivery";
    label = "Rider to delivery";
    start = rider;
    end = destination;
  }

  return {
    delivery: {
      id: delivery.id,
      trackingId: delivery.trackingId,
      status: delivery.status,
      pickupAddress: delivery.pickupAddress,
      deliveryAddress: delivery.deliveryAddress,
    },
    pickup,
    destination,
    rider,
    mode,
    label,
    start,
    end,
  };
}

async function calculateRoadRoute(journey) {
  const { start, end } = journey;

  if (!start || !end) {
    return {
      route: null,
      routeMessage:
        journey.mode === "ended"
          ? "Delivery tracking has ended."
          : "Pickup or delivery coordinates are missing.",
    };
  }

  // A changed status, rider or destination gets a different cache.
  const key = [
    journey.delivery.id,
    journey.delivery.status,
    journey.rider?.id || "preview",
    journey.mode,
    end.latitude,
    end.longitude,
  ].join(":");

  const cached = roadCache.get(key);

  // Recalculate at most once per 30 seconds for this journey.
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  if (roadCache.size >= 500) {
    roadCache.delete(roadCache.keys().next().value);
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const base = (
        process.env.OSRM_BASE_URL ||
        "https://router.project-osrm.org"
      ).replace(/\/+$/, "");

      const points =
        `${start.longitude},${start.latitude};` +
        `${end.longitude},${end.latitude}`;

      const url =
        `${base}/route/v1/driving/${points}` +
        "?overview=full&geometries=geojson&steps=false" +
        "&radiuses=300;300";

      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Routing service unavailable");
      }

      const data = await response.json();
      const route = data.routes?.[0];

      if (
        data.code !== "Ok" ||
        route?.geometry?.type !== "LineString" ||
        !Array.isArray(route.geometry.coordinates) ||
        route.geometry.coordinates.length < 2 ||
        !Number.isFinite(route.distance) ||
        !Number.isFinite(route.duration)
      ) {
        throw new Error("No road route available");
      }

      const validCoordinates = route.geometry.coordinates.every(
        (point) =>
          Array.isArray(point) &&
          coordinatePoint(point[1], point[0])
      );

      if (!validCoordinates) {
        throw new Error("Invalid route coordinates");
      }

      return {
        route: {
          coordinates: route.geometry.coordinates,
          distanceMeters: route.distance,
          durationSeconds: route.duration,
          calculatedAt: new Date().toISOString(),
        },
        routeMessage: "",
      };
    } catch {
      return {
        route: null,
        routeMessage:
          "Road route unavailable. Check the selected points or try again shortly.",
      };
    } finally {
      clearTimeout(timeout);
    }
  })();

  roadCache.set(key, {
    expiresAt: Date.now() + 30000,
    promise,
  });

  return promise;
}

// Customer: own parcel. Rider: own assigned parcel.
router.get("/journey/:id", handle(async (req, res) => {
  const journey = await loadJourney(req);
  const road = await calculateRoadRoute(journey);

  // Never return location session identifiers.
  const { start, end, ...publicJourney } = journey;

  res.json({
    ...publicJourney,
    ...road,
  });
}));

// ADMIN: Fleet list, recent GPS and rider performance.
router.get("/fleet-overview", handle(async (req, res) => {
  requireRole(req, "ADMIN");

  // Today starts at midnight in Bangladesh.
  const dhakaNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const todayStart = new Date(Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate()) - 6 * 60 * 60 * 1000);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [users, activeCounts, completedCounts, ratings] = await Promise.all([
    prisma.user.findMany({
      where: { role: "RIDER" },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        vehicleName: true,
        plateNumber: true,
        zone: true,
        riderLocation: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.delivery.groupBy({
      by: ["riderId"],
      where: { riderId: { not: null }, status: { in: ACTIVE } },
      _count: { _all: true },
    }),
    prisma.delivery.groupBy({
      by: ["riderId"],
      where: { riderId: { not: null }, status: "DELIVERED", deliveredAt: { gte: todayStart, lt: tomorrowStart } },
      _count: { _all: true },
    }),
    prisma.delivery.groupBy({
      by: ["riderId"],
      where: { riderId: { not: null }, status: "DELIVERED", rating: { not: null } },
      _avg: { rating: true },
    }),
  ]);

  const activeMap = new Map(activeCounts.map((row) => [row.riderId, row._count._all]));
  const completedMap = new Map(completedCounts.map((row) => [row.riderId, row._count._all]));
  const ratingMap = new Map(ratings.map((row) => [row.riderId, row._avg.rating]));

  const fleet = users.map((user) => {
    const activeParcels = activeMap.get(user.id) || 0;
    const location = user.status && activeParcels > 0 ? publicLocation(user.riderLocation) : null;

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      enabled: user.status,
      vehicleName: user.vehicleName,
      plateNumber: user.plateNumber,
      zone: user.zone,
      activeParcels,
      completedToday: completedMap.get(user.id) || 0,
      rating: ratingMap.get(user.id) ?? null,
      status: !user.status ? "Account Disabled" : activeParcels > 0 ? "On Delivery" : "Available",
      location,
    };
  });

  const riders = fleet.filter((rider) => rider.location).map((rider) => ({ id: rider.id, name: rider.name, ...rider.location }));

  res.json({
    fleet,
    riders,
    message: riders.length ? "" : "No riders are currently sharing a recent GPS location.",
  });
}));


module.exports = router;