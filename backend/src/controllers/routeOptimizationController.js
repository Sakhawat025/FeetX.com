const prisma = require("../config/prisma");

const ACTIVE = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"];
const GPS_MAX_AGE = 120000;
const GPS_MAX_ACCURACY = 200;

// Average speed in km/h for time estimates
const AVG_SPEED_KMH = 25;
// Fuel cost per km in BDT
const FUEL_COST_PER_KM = 4.5;

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
  if (!error.status) console.error("Route optimization:", error);

  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : "Unable to process route optimization.",
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

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    capturedAt: location.capturedAt,
  };
}

/**
 * Haversine distance between two coordinate points in km.
 */
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

/**
 * Nearest-neighbour TSP heuristic.
 * Given an array of stops (each with latitude/longitude),
 * returns the optimized ordering of indices.
 */
function nearestNeighbourTSP(stops) {
  if (stops.length <= 1) return stops.map((_, i) => i);

  const n = stops.length;

  // Build distance matrix
  const dist = Array.from({ length: n }, () => new Float64Array(n));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distanceKm(stops[i], stops[j]);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }

  // Start from index 0 (the depot / rider location)
  const visited = new Uint8Array(n);
  const order = [0];
  visited[0] = 1;

  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1];
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (!visited[j] && dist[last][j] < bestDist) {
        bestDist = dist[last][j];
        bestIdx = j;
      }
    }

    order.push(bestIdx);
    visited[bestIdx] = 1;
  }

  return order;
}

/**
 * 2-opt improvement pass on a TSP tour.
 * Tries reversing sub-segments to reduce total distance.
 */
function twoOptImprove(order, stops) {
  if (order.length <= 3) return order;

  const result = [...order];
  const n = result.length;
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        const a = stops[result[i]];
        const b = stops[result[i + 1]];
        const c = stops[result[j]];
        const d = stops[result[(j + 1) % n]] || stops[result[j]];

        const currentDist = distanceKm(a, b) + distanceKm(c, d);
        const newDist = distanceKm(a, c) + distanceKm(b, d);

        if (newDist < currentDist - 0.001) {
          // Reverse the segment between i+1 and j
          let left = i + 1;
          let right = j;

          while (left < right) {
            const temp = result[left];
            result[left] = result[right];
            result[right] = temp;
            left++;
            right--;
          }

          improved = true;
        }
      }
    }
  }

  return result;
}

/**
 * Calculate total route distance for an ordering of stops.
 */
function totalRouteDistance(order, stops) {
  let total = 0;

  for (let i = 0; i < order.length - 1; i++) {
    total += distanceKm(stops[order[i]], stops[order[i + 1]]);
  }

  return total;
}

/**
 * Calculate the original (manual/sequential) distance.
 */
function sequentialDistance(stops) {
  let total = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    total += distanceKm(stops[i], stops[i + 1]);
  }

  return total;
}

// ─────────────────────────────────────────────────────────────
// GET /admin/route-optimization?riderId=<optional>
// ─────────────────────────────────────────────────────────────
exports.getOptimization = async (req, res) => {
  try {
    const selectedRiderId =
      req.query.riderId === undefined
        ? null
        : positiveId(req.query.riderId);

    const result = await prisma.$transaction(
      async (tx) => {
        await requireAdmin(tx, req);

        // Fetch all riders with active deliveries and locations
        const riders = await tx.user.findMany({
          where: {
            role: "RIDER",
            status: true,
            isAvailable: true,
            riderDeliveries: {
              some: { status: { in: ACTIVE } },
            },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            zone: true,
            riderLocation: true,
            assignedVehicle: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            riderDeliveries: {
              where: { status: { in: ACTIVE } },
              select: {
                id: true,
                trackingId: true,
                pickupAddress: true,
                deliveryAddress: true,
                pickupLatitude: true,
                pickupLongitude: true,
                deliveryLatitude: true,
                deliveryLongitude: true,
                parcelType: true,
                parcelWeight: true,
                status: true,
                priority: true,
                assignedAt: true,
                dueAt: true,
              },
              orderBy: { assignedAt: "asc" },
            },
          },
          orderBy: { name: "asc" },
        });

        // Format rider list for sidebar
        const riderList = riders.map((rider) => ({
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          zone: rider.zone,
          vehicleName: rider.assignedVehicle?.name || null,
          vehicleType: rider.assignedVehicle?.type || null,
          activeDeliveries: rider.riderDeliveries.length,
        }));

        // Pick the selected rider or the first one
        const activeRider =
          riders.find((r) => r.id === selectedRiderId) ||
          riders[0] ||
          null;

        if (!activeRider) {
          return {
            riders: riderList,
            rider: null,
            optimization: null,
            refreshedAt: new Date().toISOString(),
          };
        }

        const location = freshLocation(activeRider.riderLocation);

        // Build stops array: rider location (depot) + all delivery stops
        const deliveries = activeRider.riderDeliveries;
        const stops = [];
        const stopMeta = [];

        // Add rider's current location as the "Warehouse / Start" point
        if (location) {
          stops.push({
            latitude: location.latitude,
            longitude: location.longitude,
          });

          stopMeta.push({
            type: "start",
            label: activeRider.zone
              ? `Warehouse - ${activeRider.zone}`
              : "Rider Location",
            address: activeRider.zone || "Current GPS",
            trackingId: null,
            deliveryId: null,
          });
        }

        // Add delivery drop-off points
        for (const delivery of deliveries) {
          if (
            coordinates(delivery.deliveryLatitude, delivery.deliveryLongitude)
          ) {
            stops.push({
              latitude: delivery.deliveryLatitude,
              longitude: delivery.deliveryLongitude,
            });

            stopMeta.push({
              type: "delivery",
              label: `${delivery.trackingId} - ${delivery.deliveryAddress}`,
              address: delivery.deliveryAddress,
              trackingId: delivery.trackingId,
              deliveryId: delivery.id,
              parcelType: delivery.parcelType,
              parcelWeight: delivery.parcelWeight,
              status: delivery.status,
              priority: delivery.priority,
              assignedAt: delivery.assignedAt,
              dueAt: delivery.dueAt,
            });
          }
        }

        let optimization = null;

        if (stops.length >= 2) {
          // Manual / original sequential distance
          const manualDistance = sequentialDistance(stops);

          // Optimized order using nearest-neighbour + 2-opt
          const rawOrder = nearestNeighbourTSP(stops);
          const optimizedOrder = twoOptImprove(rawOrder, stops);
          const optimizedDistance = totalRouteDistance(optimizedOrder, stops);

          const savings = manualDistance - optimizedDistance;
          const savingsPercent =
            manualDistance > 0 ? (savings / manualDistance) * 100 : 0;

          // Build optimized sequence
          const sequence = optimizedOrder.map((idx, position) => ({
            order: position + 1,
            ...stopMeta[idx],
            latitude: stops[idx].latitude,
            longitude: stops[idx].longitude,
          }));

          // Estimated times (based on average speed)
          const manualTimeMin = (manualDistance / AVG_SPEED_KMH) * 60;
          const optimizedTimeMin = (optimizedDistance / AVG_SPEED_KMH) * 60;
          const timeSavedMin = manualTimeMin - optimizedTimeMin;

          // Fuel cost estimates
          const manualFuelCost = manualDistance * FUEL_COST_PER_KM;
          const optimizedFuelCost = optimizedDistance * FUEL_COST_PER_KM;
          const fuelSaved = manualFuelCost - optimizedFuelCost;

          // Build ETAs for each stop
          let cumulativeDistance = 0;
          const now = new Date();

          for (let i = 0; i < sequence.length; i++) {
            if (i > 0) {
              const prev = sequence[i - 1];
              const curr = sequence[i];
              cumulativeDistance += distanceKm(prev, curr);
            }

            const etaMinutes = (cumulativeDistance / AVG_SPEED_KMH) * 60;
            const eta = new Date(now.getTime() + etaMinutes * 60 * 1000);
            sequence[i].eta = eta.toISOString();
            sequence[i].distanceFromPrev =
              i > 0
                ? distanceKm(sequence[i - 1], sequence[i])
                : 0;
          }

          optimization = {
            totalStops: stops.length,
            manualDistanceKm: Math.round(manualDistance * 10) / 10,
            optimizedDistanceKm: Math.round(optimizedDistance * 10) / 10,
            savingsKm: Math.round(savings * 10) / 10,
            savingsPercent: Math.round(savingsPercent * 10) / 10,
            estimatedTimeMin: Math.round(optimizedTimeMin),
            manualTimeMin: Math.round(manualTimeMin),
            timeSavedMin: Math.round(timeSavedMin),
            fuelSavedBDT: Math.round(fuelSaved),
            sequence,
            routeCoordinates: sequence.map((s) => ({
              latitude: s.latitude,
              longitude: s.longitude,
            })),
          };
        } else {
          optimization = {
            totalStops: stops.length,
            manualDistanceKm: 0,
            optimizedDistanceKm: 0,
            savingsKm: 0,
            savingsPercent: 0,
            estimatedTimeMin: 0,
            manualTimeMin: 0,
            timeSavedMin: 0,
            fuelSavedBDT: 0,
            sequence: stops.length
              ? [
                  {
                    order: 1,
                    ...stopMeta[0],
                    latitude: stops[0].latitude,
                    longitude: stops[0].longitude,
                    eta: new Date().toISOString(),
                    distanceFromPrev: 0,
                  },
                ]
              : [],
            routeCoordinates: stops.map((s) => ({
              latitude: s.latitude,
              longitude: s.longitude,
            })),
            blocker:
              "Not enough geocoded delivery stops to optimize a route.",
          };
        }

        return {
          riders: riderList,
          rider: {
            id: activeRider.id,
            name: activeRider.name,
            phone: activeRider.phone,
            zone: activeRider.zone,
            vehicleName: activeRider.assignedVehicle?.name || null,
            vehicleType: activeRider.assignedVehicle?.type || null,
            location,
          },
          optimization,
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

// ─────────────────────────────────────────────────────────────
// POST /admin/route-optimization/reorder
// Allows admin to manually reorder stops and get new metrics.
// Body: { riderId, stopOrder: [deliveryId1, deliveryId2, ...] }
// ─────────────────────────────────────────────────────────────
exports.reorderStops = async (req, res) => {
  try {
    const riderId = positiveId(req.body.riderId);
    const { stopOrder } = req.body;

    if (!Array.isArray(stopOrder) || stopOrder.length === 0) {
      fail(400, "stopOrder must be a non-empty array of delivery IDs.");
    }

    const orderIds = stopOrder.map((id) => positiveId(id));

    const result = await prisma.$transaction(
      async (tx) => {
        await requireAdmin(tx, req);

        const rider = await tx.user.findFirst({
          where: {
            id: riderId,
            role: "RIDER",
            status: true,
          },
          select: {
            id: true,
            name: true,
            riderLocation: true,
            zone: true,
          },
        });

        if (!rider) fail(404, "Rider not found.");

        const deliveries = await tx.delivery.findMany({
          where: {
            id: { in: orderIds },
            riderId: riderId,
            status: { in: ACTIVE },
          },
          select: {
            id: true,
            trackingId: true,
            deliveryAddress: true,
            deliveryLatitude: true,
            deliveryLongitude: true,
          },
        });

        if (deliveries.length !== orderIds.length) {
          fail(
            400,
            "Some delivery IDs are invalid or not assigned to this rider."
          );
        }

        const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));

        const location = freshLocation(rider.riderLocation);
        const stops = [];

        if (location) {
          stops.push({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }

        for (const id of orderIds) {
          const d = deliveryMap.get(id);
          if (coordinates(d.deliveryLatitude, d.deliveryLongitude)) {
            stops.push({
              latitude: d.deliveryLatitude,
              longitude: d.deliveryLongitude,
            });
          }
        }

        const totalDistance = sequentialDistance(stops);
        const totalTimeMin = (totalDistance / AVG_SPEED_KMH) * 60;
        const fuelCost = totalDistance * FUEL_COST_PER_KM;

        return {
          totalDistanceKm: Math.round(totalDistance * 10) / 10,
          estimatedTimeMin: Math.round(totalTimeMin),
          fuelCostBDT: Math.round(fuelCost),
        };
      },
      {
        isolationLevel: "RepeatableRead",
        timeout: 10000,
      }
    );

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

