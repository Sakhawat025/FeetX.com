// Fixed GPS start, open route, no automatic return to the depot.

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function validPoint(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

function freshLocation(location, now = Date.now()) {
  if (
    !location?.sessionId ||
    !validPoint(location.latitude, location.longitude)
  ) {
    return null;
  }

  const age = now - new Date(location.capturedAt).getTime();

  if (
    !location.capturedAt ||
    !Number.isFinite(age) ||
    age < -10000 ||
    age > 120000 ||
    !Number.isFinite(location.accuracy) ||
    location.accuracy < 0 ||
    location.accuracy > 200
  ) {
    return null;
  }

  return location;
}

function buildStops(location, deliveries) {
  if (!freshLocation(location)) {
    fail(
      409,
      "Fresh rider GPS required. Turn on location sharing (accuracy within 200 m) and refresh."
    );
  }

  const stops = [
    {
      key: "start",
      type: "start",
      label: "Rider GPS start",
      address: "Current rider location",
      latitude: location.latitude,
      longitude: location.longitude,
    },
  ];

  for (const delivery of deliveries) {
    function add(type, latitude, longitude, address) {
      if (!validPoint(latitude, longitude)) {
        fail(
          409,
          `Missing or invalid ${type} coordinates for ${delivery.trackingId}. Update this parcel before planning.`
        );
      }

      stops.push({
        key: `${type}:${delivery.id}`,
        type,
        deliveryId: delivery.id,
        trackingId: delivery.trackingId,
        priority: delivery.priority,
        address,
        label: `${
          type === "pickup" ? "Pickup" : "Deliver"
        } ${delivery.trackingId}`,
        latitude,
        longitude,
        requires:
          type === "delivery" && delivery.status === "CONFIRMED"
            ? `pickup:${delivery.id}`
            : null,
      });
    }

    if (delivery.status === "CONFIRMED") {
      add(
        "pickup",
        delivery.pickupLatitude,
        delivery.pickupLongitude,
        delivery.pickupAddress
      );
    }

    add(
      "delivery",
      delivery.deliveryLatitude,
      delivery.deliveryLongitude,
      delivery.deliveryAddress
    );
  }

  if (stops.length < 2) {
    fail(409, "No active delivery stops to plan.");
  }

  if (stops.length > 41) {
    fail(
      409,
      "This planner supports up to 40 pickup/delivery stops per rider. Split this workload first."
    );
  }

  return stops;
}

function feasible(order, stops) {
  const seen = new Set();

  for (const index of order) {
    const stop = stops[index];

    if (stop.requires && !seen.has(stop.requires)) {
      return false;
    }

    seen.add(stop.key);
  }

  return true;
}

function manualOrder(stops, keys) {
  if (keys === undefined) {
    return stops.map((_, index) => index);
  }

  if (
    !Array.isArray(keys) ||
    keys.length !== stops.length - 1 ||
    new Set(keys).size !== keys.length
  ) {
    fail(
      400,
      "Supply every pickup/delivery stop exactly once. Refresh if assignments changed."
    );
  }

  const indexes = new Map(
    stops.map((stop, index) => [stop.key, index])
  );

  const order = [
    0,
    ...keys.map((key) => indexes.get(key)),
  ];

  if (
    order
      .slice(1)
      .some((index) => !Number.isInteger(index) || index === 0) ||
    !feasible(order, stops)
  ) {
    fail(
      400,
      "Invalid stop order. Each pickup must appear before its delivery."
    );
  }

  return order;
}

function cost(order, matrix) {
  return order.slice(1).reduce(
    (sum, destination, index) =>
      sum + matrix[order[index]][destination],
    0
  );
}

function optimizeOrder(stops, matrix, manual) {
  const greedy = [0];

  const remaining = new Set(
    stops.slice(1).map((_, index) => index + 1)
  );

  const seen = new Set(["start"]);

  while (remaining.size) {
    const candidates = [...remaining].filter(
      (index) =>
        !stops[index].requires ||
        seen.has(stops[index].requires)
    );

    candidates.sort(
      (a, b) =>
        matrix[greedy.at(-1)][a] -
          matrix[greedy.at(-1)][b] ||
        a - b
    );

    const next = candidates[0];

    greedy.push(next);
    remaining.delete(next);
    seen.add(stops[next].key);
  }

  let best =
    cost(greedy, matrix) < cost(manual, matrix)
      ? greedy
      : [...manual];

  let bestCost = cost(best, matrix);

  // Full directed-route cost handles one-way roads correctly.
  // Index 0 always remains the GPS start.
  for (let pass = 0; pass < 30; pass++) {
    let improved = false;

    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];

        if (!feasible(candidate, stops)) {
          continue;
        }

        const value = cost(candidate, matrix);

        if (value < bestCost - 0.01) {
          best = candidate;
          bestCost = value;
          improved = true;
        }
      }
    }

    if (!improved) {
      break;
    }
  }

  return best;
}

async function osrm(service, stops, query, fetchImpl) {
  const base = (
    process.env.OSRM_BASE_URL ||
    "https://router.project-osrm.org"
  ).replace(/\/$/, "");

  const profile = encodeURIComponent(
    process.env.OSRM_PROFILE || "driving"
  );

  const coordinates = stops
    .map((stop) => `${stop.longitude},${stop.latitude}`)
    .join(";");

  const radiuses = stops.map(() => 1000).join(";");

  try {
    const response = await fetchImpl(
      `${base}/${service}/v1/${profile}/${coordinates}?${query}&radiuses=${radiuses}`,
      {
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      throw new Error("Routing HTTP failure");
    }

    const body = await response.json();

    if (body.code !== "Ok") {
      throw new Error("Routing response failure");
    }

    return body;
  } catch (_) {
    fail(
      502,
      "Road routing unavailable or a stop cannot be reached. Check OSRM/internet and parcel coordinates, then retry."
    );
  }
}

async function roadRoute(stops, order, fetchImpl, now) {
  const ordered = order.map((index) => stops[index]);

  const body = await osrm(
    "route",
    ordered,
    "overview=full&geometries=geojson&steps=false&continue_straight=false",
    fetchImpl
  );

  const route = body.routes?.[0];

  const nonnegative = (value) =>
    Number.isFinite(value) && value >= 0;

  if (
    !route ||
    !nonnegative(route.distance) ||
    !nonnegative(route.duration) ||
    route.geometry?.type !== "LineString" ||
    !Array.isArray(route.geometry.coordinates) ||
    route.geometry.coordinates.length < 2 ||
    route.geometry.coordinates.some(
      (point) =>
        !Array.isArray(point) ||
        !validPoint(point[1], point[0])
    ) ||
    route.legs?.length !== stops.length - 1 ||
    route.legs.some(
      (leg) =>
        !nonnegative(leg.distance) ||
        !nonnegative(leg.duration)
    )
  ) {
    fail(502, "Invalid road route response. Please retry.");
  }

  let elapsed = 0;

  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry,

    sequence: ordered.map((stop, index) => {
      const leg = index ? route.legs[index - 1] : null;

      elapsed += leg?.duration || 0;

      return {
        ...stop,
        order: index,
        distanceFromPrev: (leg?.distance || 0) / 1000,
        eta: new Date(
          now + elapsed * 1000
        ).toISOString(),
      };
    }),
  };
}

async function compareRoutes(
  stops,
  keys,
  fetchImpl = fetch,
  now = Date.now()
) {
  const manual = manualOrder(stops, keys);

  const table = await osrm(
    "table",
    stops,
    "annotations=distance",
    fetchImpl
  );

  const matrix = table.distances;

  if (
    !Array.isArray(matrix) ||
    matrix.length !== stops.length ||
    matrix.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== stops.length ||
        row.some(
          (distance) =>
            !Number.isFinite(distance) ||
            distance < 0
        )
    )
  ) {
    fail(
      502,
      "Some stops are unreachable, or the routing server does not support distance tables. Check coordinates and OSRM configuration."
    );
  }

  const optimized = optimizeOrder(stops, matrix, manual);

  const same = manual.every(
    (value, index) => value === optimized[index]
  );

  const [manualRoute, candidate] = await Promise.all([
    roadRoute(stops, manual, fetchImpl, now),

    same
      ? Promise.resolve(null)
      : roadRoute(stops, optimized, fetchImpl, now),
  ]);

  // Validate against the actual drawn road route too.
  // Never report a longer candidate as an improvement.
  const optimizedRoute =
    candidate &&
    candidate.distanceKm < manualRoute.distanceKm - 0.00001
      ? candidate
      : manualRoute;

  const savingsKm =
    manualRoute.distanceKm - optimizedRoute.distanceKm;

  return {
    totalStops: stops.length - 1,

    manualRoute,
    optimizedRoute,

    manualDistanceKm: manualRoute.distanceKm,
    optimizedDistanceKm: optimizedRoute.distanceKm,

    savingsKm,
    savingsPercent: manualRoute.distanceKm
      ? (savingsKm / manualRoute.distanceKm) * 100
      : 0,

    manualTimeMin: manualRoute.durationMin,
    estimatedTimeMin: optimizedRoute.durationMin,

    timeSavedMin:
      manualRoute.durationMin -
      optimizedRoute.durationMin,

    fuelSavedBDT: savingsKm * 4.5,

    sequence: optimizedRoute.sequence,
    sameOrder: optimizedRoute === manualRoute,

    note:
      optimizedRoute === manualRoute
        ? "No shorter route found. Manual and optimized paths may overlap."
        : "A shorter delivery sequence was found using road distances.",

    distanceSource: "OSRM road network",
  };
}

module.exports = {
  buildStops,
  compareRoutes,
  manualOrder,
  optimizeOrder,
  cost,
  feasible,
  freshLocation,
};