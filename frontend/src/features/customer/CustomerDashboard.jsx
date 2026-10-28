import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CheckCircle2,
  Clock3,
  CalendarClock,
  Eye,
} from "lucide-react";

import CustomerHeader from "./components/CustomerHeader";
import StatCard from "./components/StatCard";
import TrackingMap from "./components/TrackingMap";
import ParcelTimeline from "./components/ParcelTimeline";
import { getCustomerDashboard } from "../../services/deliveryApi";

const ACTIVE_STATUSES = [
  "CONFIRMED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
];

function getArrival(journey, deliveryId, now) {
  if (!deliveryId) {
    return {
      value: "N/A",
      subtitle: "No current parcel",
    };
  }

  if (
    !journey ||
    String(journey.delivery?.id) !== String(deliveryId)
  ) {
    return {
      value: "N/A",
      subtitle: "Waiting for route data",
    };
  }

  const status = journey.delivery.status;

  if (status === "DELIVERED") {
    return {
      value: "Delivered",
      subtitle: "Delivery completed",
    };
  }

  if (["CANCELLED", "RETURNED"].includes(status)) {
    return {
      value: "N/A",
      subtitle: "Delivery ended",
    };
  }

  if (status === "PENDING") {
    return {
      value: "Pending",
      subtitle: "Waiting for rider assignment",
    };
  }

  if (status === "CONFIRMED") {
    return {
      value: "Pending",
      subtitle: "Waiting for pickup",
    };
  }

  const gpsAge =
    now - new Date(journey.rider?.capturedAt).getTime();

  const routeAge =
    now - new Date(journey.route?.calculatedAt).getTime();

  const seconds = journey.route?.durationSeconds;

  if (
    journey.mode !== "delivery" ||
    !journey.rider ||
    !Number.isFinite(gpsAge) ||
    gpsAge < -10000 ||
    gpsAge > 120000
  ) {
    return {
      value: "N/A",
      subtitle: "Waiting for fresh rider GPS",
    };
  }

  if (
    !Number.isFinite(seconds) ||
    seconds < 0 ||
    !Number.isFinite(routeAge) ||
    routeAge < -10000 ||
    routeAge > 120000
  ) {
    return {
      value: "N/A",
      subtitle: "Route estimate unavailable",
    };
  }

  return {
    value: `${Math.max(1, Math.ceil(seconds / 60))} min`,
    subtitle: "Est. driving time; excludes traffic and stops",
  };
}

function statusClass(status) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-50 text-green-700 border-green-100";

    case "CONFIRMED":
      return "bg-yellow-50 text-yellow-700 border-yellow-100";

    case "PICKED_UP":
      return "bg-purple-50 text-purple-700 border-purple-100";

    case "OUT_FOR_DELIVERY":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "CANCELLED":
    case "RETURNED":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function formatStatus(status) {
  return (status || "UNKNOWN")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [journey, setJourney] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    let timer;

    async function loadDashboard() {
      try {
        const data = await getCustomerDashboard();

        if (!data || !Array.isArray(data.recentDeliveries)) {
          throw new Error("Invalid dashboard response.");
        }

        if (active) {
          setDashboardData(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = window.setTimeout(loadDashboard, 30000);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const recentDeliveries = dashboardData?.recentDeliveries || [];

  const currentParcel =
    recentDeliveries.find((delivery) =>
      ACTIVE_STATUSES.includes(delivery.status)
    ) ||
    recentDeliveries.find(
      (delivery) => delivery.status === "PENDING"
    ) ||
    recentDeliveries[0] ||
    null;

  const currentJourney =
    currentParcel &&
    String(journey?.delivery?.id) === String(currentParcel.id)
      ? journey
      : null;

  const arrival = getArrival(
    currentJourney,
    currentParcel?.id,
    now
  );

  // Keep the status panel in sync with the tracking response.
  const displayedParcel = currentParcel
    ? {
        ...currentParcel,
        ...(currentJourney?.delivery || {}),
      }
    : null;

  const gpsAge = currentJourney?.rider
    ? now - new Date(currentJourney.rider.capturedAt).getTime()
    : Infinity;

  const hasFreshGps =
    ACTIVE_STATUSES.includes(currentJourney?.delivery?.status) &&
    Number.isFinite(gpsAge) &&
    gpsAge >= -10000 &&
    gpsAge <= 120000;

  function statValue(key) {
    if (loading) return "...";
    if (!dashboardData) return "N/A";

    return String(dashboardData.stats?.[key] ?? 0).padStart(
      2,
      "0"
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf4]">
      <div className="flex min-h-screen">
        <main className="min-w-0 flex-1">
          <CustomerHeader />

          <div className="space-y-6 p-5 lg:p-8">
            {loading && (
              <p className="text-sm text-gray-500">
                Loading dashboard...
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}{" "}
                {dashboardData &&
                  "Showing previously loaded dashboard data. "}
                Retrying automatically.
              </p>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Box}
                title="Active Parcel"
                value={statValue("active")}
                subtitle="In Progress"
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
              />

              <StatCard
                icon={CheckCircle2}
                title="Delivered"
                value={statValue("delivered")}
                subtitle="All Time"
                iconBg="bg-green-50"
                iconColor="text-green-600"
              />

              <StatCard
                icon={Clock3}
                title="Pending"
                value={statValue("pending")}
                subtitle="Awaiting Confirmation"
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
              />

              <StatCard
                icon={CalendarClock}
                title="Est. Arrival"
                value={loading ? "..." : arrival.value}
                subtitle={
                  loading
                    ? "Loading current parcel"
                    : arrival.subtitle
                }
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    Live Tracking
                  </h2>

                  <span
                    className={`flex items-center gap-2 text-sm font-semibold ${
                      hasFreshGps
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        hasFreshGps
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />

                    {hasFreshGps ? "Recent GPS" : "No live GPS"}
                  </span>
                </div>

                <TrackingMap
                  deliveryId={currentParcel?.id}
                  onJourney={setJourney}
                />
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">
                  Parcel Status
                </h2>

                <div className="mt-4 break-words rounded-xl bg-orange-50 px-4 py-3 text-center text-sm font-bold">
                  Parcel ID:{" "}
                  <span className="text-orange-700">
                    {displayedParcel?.trackingId || "No parcel"}
                  </span>
                </div>

                <div className="mt-5">
                  {displayedParcel ? (
                    <ParcelTimeline delivery={displayedParcel} />
                  ) : (
                    <p className="text-sm text-gray-500">
                      No parcel available to track.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
                <div className="p-5">
                  <h2 className="text-xl font-bold">
                    Recent Deliveries
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-orange-50 text-gray-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">
                          Parcel ID
                        </th>
                        <th className="px-5 py-3 font-semibold">
                          Date
                        </th>
                        <th className="px-5 py-3 font-semibold">
                          To
                        </th>
                        <th className="px-5 py-3 font-semibold">
                          Status
                        </th>
                        <th className="px-5 py-3 font-semibold">
                          Rider
                        </th>
                        <th className="px-5 py-3 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentDeliveries.map((delivery) => (
                        <tr
                          key={delivery.id}
                          className="border-t border-gray-100 transition hover:bg-orange-50/40"
                        >
                          <td className="px-5 py-4 font-bold">
                            {delivery.trackingId}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {delivery.createdAt
                              ? new Date(
                                  delivery.createdAt
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  timeZone: "Asia/Dhaka",
                                })
                              : "-"}
                          </td>

                          <td className="px-5 py-4">
                            {delivery.deliveryAddress}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${statusClass(
                                delivery.status
                              )}`}
                            >
                              {formatStatus(delivery.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {delivery.rider?.name || "-"}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/customer/tracking?trackingId=${encodeURIComponent(
                                    delivery.trackingId
                                  )}`
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-orange-700 hover:bg-orange-100"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}

                      {!loading &&
                        !error &&
                        recentDeliveries.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-8 text-center text-gray-500"
                            >
                              No deliveries found.
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}