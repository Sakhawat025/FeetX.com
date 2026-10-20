const prisma = require("../config/prisma");

const DAY = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET = 6 * 60 * 60 * 1000;

const ACTIVE_STATUSES = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"];

function dhakaDayStart(value = Date.now()) {
  const local = new Date(value + DHAKA_OFFSET);
  return new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate()
    ) - DHAKA_OFFSET
  );
}

function dayKey(value) {
  return new Date(new Date(value).getTime() + DHAKA_OFFSET)
    .toISOString()
    .slice(0, 10);
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function deliveryMinutes(delivery) {
  if (!delivery.assignedAt || !delivery.deliveredAt) return null;

  const minutes =
    (new Date(delivery.deliveredAt).getTime() -
      new Date(delivery.assignedAt).getTime()) /
    60000;

  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

// Straight-line distance; not road distance or GPS mileage.
function distanceKm(delivery) {
  const {
    pickupLatitude: lat1,
    pickupLongitude: lng1,
    deliveryLatitude: lat2,
    deliveryLongitude: lng2,
  } = delivery;

  if (
    ![lat1, lng1, lat2, lng2].every(Number.isFinite) ||
    Math.abs(lat1) > 90 ||
    Math.abs(lat2) > 90 ||
    Math.abs(lng1) > 180 ||
    Math.abs(lng2) > 180
  ) {
    return null;
  }

  const rad = Math.PI / 180;
  const value =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(((lng2 - lng1) * rad) / 2) ** 2;

  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, value))));
}

function summarize(deliveries) {
  const timed = deliveries.filter(
    (delivery) => delivery.dueAt && delivery.deliveredAt
  );

  const onTimeCount = timed.filter(
    (delivery) =>
      new Date(delivery.deliveredAt).getTime() <=
      new Date(delivery.dueAt).getTime()
  ).length;

  const durations = deliveries
    .map(deliveryMinutes)
    .filter((value) => value !== null);

  const ratings = deliveries
    .map((delivery) => delivery.rating)
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  return {
    completed: deliveries.length,
    onTimeRate: timed.length ? (onTimeCount / timed.length) * 100 : null,
    timedCount: timed.length,
    avgMinutes: average(durations),
    durationCount: durations.length,
    rating: average(ratings),
    reviewCount: ratings.length,
  };
}

function difference(current, previous) {
  return current === null || previous === null ? null : current - previous;
}

exports.getAnalytics = async (req, res) => {
  try {
    // Verify current account state, not only the JWT role.
    const admin = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        role: "ADMIN",
        status: true,
      },
      select: { id: true },
    });

    if (!admin) {
      return res.status(403).json({
        message: "Active administrator access required.",
      });
    }

    const today = dhakaDayStart();
    const end = new Date(today.getTime() + DAY);

    // Current period: 30 calendar days including today.
    const currentStart = new Date(today.getTime() - 29 * DAY);
    const previousStart = new Date(currentStart.getTime() - 30 * DAY);
    const dailyStart = new Date(today.getTime() - 6 * DAY);
    const trendStart = new Date(today.getTime() - 27 * DAY);

    const [riders, completed, recentBookings, workloads] =
      await prisma.$transaction(
        [
          prisma.user.findMany({
            where: { role: "RIDER" },
            select: { id: true, name: true, status: true },
            orderBy: { name: "asc" },
          }),
          prisma.delivery.findMany({
            where: {
              status: "DELIVERED",
              deliveredAt: { gte: previousStart, lt: end },
            },
            select: {
              riderId: true,
              assignedAt: true,
              dueAt: true,
              deliveredAt: true,
              rating: true,
              pickupLatitude: true,
              pickupLongitude: true,
              deliveryLatitude: true,
              deliveryLongitude: true,
            },
          }),
          prisma.delivery.findMany({
            where: {
              createdAt: { gte: dailyStart, lt: end },
            },
            select: { createdAt: true, status: true },
          }),
          prisma.delivery.groupBy({
            by: ["riderId"],
            where: {
              riderId: { not: null },
              status: { in: ACTIVE_STATUSES },
            },
            _count: { _all: true },
          }),
        ],
        { isolationLevel: "RepeatableRead" }
      );

    const currentDeliveries = completed.filter(
      (delivery) => new Date(delivery.deliveredAt) >= currentStart
    );

    const previousDeliveries = completed.filter(
      (delivery) => new Date(delivery.deliveredAt) < currentStart
    );

    const current = summarize(currentDeliveries);
    const previous = summarize(previousDeliveries);

    const workloadMap = new Map(
      workloads.map((row) => [row.riderId, row._count._all])
    );

    const enabledRiders = riders.filter((rider) => rider.status);
    const activeRiders = enabledRiders.filter(
      (rider) => (workloadMap.get(rider.id) || 0) > 0
    ).length;

    const fleet = {
      active: activeRiders,
      idle: enabledRiders.length - activeRiders,
      disabled: riders.length - enabledRiders.length,
      enabled: enabledRiders.length,
      total: riders.length,
      utilization: enabledRiders.length
        ? (activeRiders / enabledRiders.length) * 100
        : null,
    };

    const daily = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(dailyStart.getTime() + index * DAY);
      const key = dayKey(date);
      const bookings = recentBookings.filter(
        (delivery) => dayKey(delivery.createdAt) === key
      );

      return {
        date: key,
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "Asia/Dhaka",
        }),
        delivered: bookings.filter(
          (delivery) => delivery.status === "DELIVERED"
        ).length,
        cancelled: bookings.filter(
          (delivery) => delivery.status === "CANCELLED"
        ).length,
      };
    });

    const trend = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(trendStart.getTime() + index * 7 * DAY);
      const finish = new Date(start.getTime() + 7 * DAY);

      const deliveries = currentDeliveries.filter((delivery) => {
        const date = new Date(delivery.deliveredAt);
        return date >= start && date < finish;
      });

      const distances = deliveries
        .map(distanceKm)
        .filter((value) => value !== null);

      const durations = deliveries
        .map(deliveryMinutes)
        .filter((value) => value !== null);

      return {
        week: `W${index + 1}`,
        from: dayKey(start),
        to: dayKey(new Date(finish.getTime() - DAY)),
        avgDistanceKm: average(distances),
        avgMinutes: average(durations),
        distanceCount: distances.length,
        durationCount: durations.length,
      };
    });

    const performance = riders
      .map((rider) => ({
        id: rider.id,
        name: rider.name,
        ...summarize(
          currentDeliveries.filter(
            (delivery) => delivery.riderId === rider.id
          )
        ),
      }))
      .sort(
        (a, b) => b.completed - a.completed || a.name.localeCompare(b.name)
      );

    res.set("Cache-Control", "no-store");

    return res.json({
      generatedAt: new Date().toISOString(),
      period: {
        from: dayKey(currentStart),
        to: dayKey(today),
      },
      summary: {
        ...current,
        onTimeChange: difference(current.onTimeRate, previous.onTimeRate),
        minutesChange: difference(current.avgMinutes, previous.avgMinutes),
      },
      fleet,
      daily,
      trend,
      performance,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      message: "Unable to load analytics. Please retry.",
    });
  }
};