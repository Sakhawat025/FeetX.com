const DAY = 86400000;
const OFFSET = 6 * 3600000;

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

function fail(message) {
  throw Object.assign(new Error(message), { status: 400 });
}

function dayKey(value) {
  return new Date(new Date(value).getTime() + OFFSET)
    .toISOString()
    .slice(0, 10);
}

function parseDay(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    fail("Use YYYY-MM-DD dates.");
  }

  const result = new Date(`${value}T00:00:00+06:00`);

  if (
    !Number.isFinite(result.getTime()) ||
    dayKey(result) !== value
  ) {
    fail("Invalid calendar date.");
  }

  return result;
}

function parseFilters(query, now = Date.now()) {
  const to = query.to === undefined ? dayKey(now) : query.to;
  const endDay = parseDay(to);

  const from =
    query.from === undefined
      ? dayKey(endDay.getTime() - 27 * DAY)
      : query.from;

  const start = parseDay(from);
  const end = new Date(endDay.getTime() + DAY);
  const days = (end - start) / DAY;

  if (days < 1 || days > 93) {
    fail("Choose a date range of 1 to 93 days.");
  }

  if (to > dayKey(now)) {
    fail("The end date cannot be in the future.");
  }

  let riderId = null;

  if (query.riderId !== undefined && query.riderId !== "") {
    if (
      typeof query.riderId !== "string" ||
      !/^\d+$/.test(query.riderId)
    ) {
      fail("Invalid rider ID.");
    }

    riderId = Number(query.riderId);

    if (!Number.isSafeInteger(riderId) || riderId <= 0) {
      fail("Invalid rider ID.");
    }
  }

  const rate =
    query.rate === undefined ? 4.5 : Number(query.rate);

  if (
    query.rate === "" ||
    Array.isArray(query.rate) ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 1000
  ) {
    fail("Cost per km must be between 0 and 1000 BDT.");
  }

  return {
    from,
    to,
    start,
    end,
    days,
    riderId,
    rate,
  };
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) /
        values.length
    : null;
}

function minutes(delivery) {
  if (!delivery.assignedAt || !delivery.deliveredAt) {
    return null;
  }

  const value =
    (new Date(delivery.deliveredAt) -
      new Date(delivery.assignedAt)) /
    60000;

  return Number.isFinite(value) && value >= 0
    ? value
    : null;
}

// Straight-line distance estimate, not road mileage.
function distance(delivery) {
  const {
    pickupLatitude: a,
    pickupLongitude: b,
    deliveryLatitude: c,
    deliveryLongitude: d,
  } = delivery;

  if (
    ![a, b, c, d].every(Number.isFinite) ||
    Math.abs(a) > 90 ||
    Math.abs(c) > 90 ||
    Math.abs(b) > 180 ||
    Math.abs(d) > 180
  ) {
    return null;
  }

  const rad = Math.PI / 180;

  const h =
    Math.sin(((c - a) * rad) / 2) ** 2 +
    Math.cos(a * rad) *
      Math.cos(c * rad) *
      Math.sin(((d - b) * rad) / 2) ** 2;

  return (
    12742 *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))))
  );
}

function summarize(rows, rate) {
  const timed = rows.filter(
    (delivery) => delivery.dueAt && delivery.deliveredAt
  );

  const onTime = timed.filter(
    (delivery) =>
      new Date(delivery.deliveredAt) <=
      new Date(delivery.dueAt)
  ).length;

  const durations = rows
    .map(minutes)
    .filter((value) => value !== null);

  const distances = rows
    .map(distance)
    .filter((value) => value !== null);

  const ratings = rows
    .map((delivery) => delivery.rating)
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value >= 1 &&
        value <= 5
    );

  const totalKm = distances.length
    ? distances.reduce((sum, value) => sum + value, 0)
    : null;

  return {
    completed: rows.length,

    timedCount: timed.length,
    onTime,
    late: timed.length - onTime,
    onTimeRate: timed.length
      ? (onTime / timed.length) * 100
      : null,

    avgMinutes: average(durations),
    durationCount: durations.length,

    rating: average(ratings),
    reviewCount: ratings.length,

    distanceCount: distances.length,
    missingDistance: rows.length - distances.length,

    totalKm,
    avgKm: average(distances),

    estimatedCost:
      totalKm === null ? null : totalKm * rate,

    costPerMeasuredDelivery: distances.length
      ? (totalKm * rate) / distances.length
      : null,
  };
}

function buildReport(
  rows,
  riders,
  filters,
  now = Date.now()
) {
  const within = (value) =>
    value &&
    new Date(value) >= filters.start &&
    new Date(value) < filters.end;

  // Booking cohort: created in the selected period.
  const bookings = rows.filter((delivery) =>
    within(delivery.createdAt)
  );

  // Completions: delivered in the selected period,
  // including parcels booked before the period.
  const completed = rows.filter(
    (delivery) =>
      delivery.status === "DELIVERED" &&
      within(delivery.deliveredAt)
  );

  const totals = Object.fromEntries(
    STATUSES.map((status) => [status, 0])
  );

  for (const delivery of bookings) {
    totals[delivery.status]++;
  }

  const summary = {
    ...summarize(completed, filters.rate),
    bookings: bookings.length,
    statuses: totals,
  };

  const daily = Array.from(
    { length: filters.days },
    (_, index) => {
      const date = dayKey(
        filters.start.getTime() + index * DAY
      );

      const cohort = bookings.filter(
        (delivery) => dayKey(delivery.createdAt) === date
      );

      return {
        date,
        booked: cohort.length,
        delivered: cohort.filter(
          (delivery) => delivery.status === "DELIVERED"
        ).length,
        cancelled: cohort.filter(
          (delivery) => delivery.status === "CANCELLED"
        ).length,
      };
    }
  );

  const trend = Array.from(
    { length: Math.ceil(filters.days / 7) },
    (_, index) => {
      const start =
        filters.start.getTime() + index * 7 * DAY;

      const end = Math.min(
        start + 7 * DAY,
        filters.end.getTime()
      );

      const deliveries = completed.filter(
        (delivery) =>
          new Date(delivery.deliveredAt) >= start &&
          new Date(delivery.deliveredAt) < end
      );

      return {
        label: `W${index + 1}`,
        from: dayKey(start),
        to: dayKey(end - DAY),
        ...summarize(deliveries, filters.rate),
      };
    }
  );

  const selected = riders.filter(
    (rider) =>
      filters.riderId === null ||
      rider.id === filters.riderId
  );

  const performance = selected.map((rider) => ({
    id: rider.id,
    name: rider.name,
    enabled: rider.status,

    bookings: bookings.filter(
      (delivery) => delivery.riderId === rider.id
    ).length,

    ...summarize(
      completed.filter(
        (delivery) => delivery.riderId === rider.id
      ),
      filters.rate
    ),
  }));

  if (
    filters.riderId === null &&
    rows.some((delivery) => delivery.riderId === null)
  ) {
    performance.push({
      id: null,
      name: "Unassigned",
      enabled: false,

      bookings: bookings.filter(
        (delivery) => delivery.riderId === null
      ).length,

      ...summarize(
        completed.filter(
          (delivery) => delivery.riderId === null
        ),
        filters.rate
      ),
    });
  }

  performance.sort(
    (a, b) =>
      b.completed - a.completed ||
      a.name.localeCompare(b.name)
  );

  const names = new Map(
    riders.map((rider) => [rider.id, rider.name])
  );

  return {
    generatedAt: new Date(now).toISOString(),

    filters: {
      from: filters.from,
      to: filters.to,
      riderId: filters.riderId,
      rate: filters.rate,
      timezone: "Asia/Dhaka",
    },

    riders,
    summary,
    daily,
    trend,
    performance,

    deliveries: bookings.map((delivery) => ({
      id: delivery.id,
      trackingId: delivery.trackingId,
      rider: names.get(delivery.riderId) || "Unassigned",
      status: delivery.status,
      createdAt: delivery.createdAt,
      deliveredAt: delivery.deliveredAt,
      priority: delivery.priority || "STANDARD",
    })),
  };
}

module.exports = {
  parseFilters,
  buildReport,
  summarize,
  distance,
  minutes,
};