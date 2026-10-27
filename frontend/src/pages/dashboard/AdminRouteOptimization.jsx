import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Fuel,
  MapPin,
  Package,
  RefreshCw,
  Route,
  Timer,
  TrendingDown,
} from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import RouteOptimizationMap from "../../features/admin/components/RouteOptimizationMap";
import { useAuth } from "../../context/AuthContext";
import { getRouteOptimization } from "../../services/routeOptimizationApi";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function errorMessage(error) {
  return error.response?.data?.message || "Request failed. Please try again.";
}

function formatTime(isoString) {
  if (!isoString) return "";

  try {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export default function AdminRouteOptimization() {
  const { user, logout } = useAuth();

  const [data, setData] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const busyRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setLoadError("");

    async function load() {
      if (busyRef.current) return;

      busyRef.current = true;

      try {
        const result = await getRouteOptimization(
          selectedRiderId,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setData(result);
          setLoadError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(errorMessage(error));
        }
      } finally {
        busyRef.current = false;

        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [selectedRiderId, reload]);

  const opt = data?.optimization;
  const rider = data?.rider;
  const riders = data?.riders || [];
  const sequence = opt?.sequence || [];

  const riderDisplayName =
    rider && rider.vehicleName
      ? `${rider.name} - ${rider.vehicleName}`
      : rider?.name || "";

  return (
    <AdminLayout>
      <section className="min-h-screen bg-[#fdf3e7] p-4 text-[#40200f] sm:p-6 xl:p-8">
        <Link
          to="/admin/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm lg:hidden"
        >
          <ArrowLeft size={17} />
          Dashboard
        </Link>

        {/* Header */}
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Operations</p>
            <h1 className="mt-1 text-3xl font-bold">
              Route Optimization 👋
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Multi-stop route planning for maximum delivery efficiency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setReload((v) => v + 1)}
              aria-label="Refresh optimization"
              className="rounded-full border border-orange-100 bg-white
                p-3 text-orange-600 disabled:opacity-50"
            >
              <RefreshCw size={18} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#40200f] font-semibold text-white">
              {initials(user?.name || "Admin")}
            </div>

            <div>
              <p className="text-sm font-semibold">
                {user?.name || "Admin"}
              </p>
              <button
                type="button"
                onClick={logout}
                className="text-xs text-orange-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Error */}
        {loadError && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {loadError}
          </div>
        )}

        {loading ? (
          <div
            role="status"
            className="rounded-3xl bg-white p-12 text-center text-slate-500"
          >
            Loading route optimization data...
          </div>
        ) : !rider ? (
          <div className="rounded-3xl bg-white p-12 text-center">
            <Route size={48} className="mx-auto text-orange-300" />
            <p className="mt-4 text-sm text-slate-500">
              No riders with active deliveries and fresh GPS found.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Riders need assigned deliveries and active location sharing.
            </p>
          </div>
        ) : (
          <>
            {/* Rider selector (if multiple riders) */}
            {riders.length > 1 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium">Rider:</label>

                <select
                  value={rider.id}
                  onChange={(e) =>
                    setSelectedRiderId(Number(e.target.value))
                  }
                  className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm"
                >
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.vehicleName ? ` - ${r.vehicleName}` : ""}
                      {` (${r.activeDeliveries} stops)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              {/* Left: Map */}
              <div className="space-y-5">
                <section className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-base font-bold">
                    Optimized Multi-Stop Route
                  </h2>

                  <RouteOptimizationMap
                    sequence={sequence}
                    riderName={riderDisplayName}
                  />
                </section>
              </div>

              {/* Right: Stats sidebar */}
              <div className="space-y-5">
                {/* Distance Comparison */}
                <section className="rounded-3xl bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900">
                    Distance Comparison
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        Manual Route
                      </span>
                      <span className="text-lg font-bold">
                        {opt.manualDistanceKm} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                      <span className="text-sm font-semibold text-orange-700">
                        Optimized Route
                      </span>
                      <span className="text-lg font-bold text-orange-700">
                        {opt.optimizedDistanceKm} km
                      </span>
                    </div>

                    {opt.savingsPercent > 0 && (
                      <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                        <TrendingDown size={14} />
                        {opt.savingsPercent}% shorter distance
                      </p>
                    )}
                  </div>
                </section>

                {/* Route Summary */}
                <section className="rounded-3xl bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900">
                    Route Summary
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                        <Package size={18} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Total Stops
                        </p>
                        <p className="text-lg font-bold">
                          {opt.totalStops}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Clock size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Est. Time</p>
                        <p className="text-lg font-bold">
                          {opt.estimatedTimeMin} min
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                        <Fuel size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Fuel Saved
                        </p>
                        <p className="text-lg font-bold">
                          ~{opt.fuelSavedBDT} BDT
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                        <Timer size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Time Saved
                        </p>
                        <p className="text-lg font-bold">
                          {opt.timeSavedMin} min
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Delivery Sequence */}
                <section className="rounded-3xl bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900">
                    Delivery Sequence
                  </h3>

                  <div className="mt-4 space-y-0">
                    {sequence.map((stop, index) => (
                      <div
                        key={stop.order}
                        className="relative flex items-start gap-3 pb-4"
                      >
                        {/* Vertical line connector */}
                        {index < sequence.length - 1 && (
                          <div className="absolute left-[14px] top-[30px] h-[calc(100%-22px)] w-0.5 bg-orange-200" />
                        )}

                        {/* Step number */}
                        <div
                          className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                            stop.type === "start"
                              ? "bg-emerald-600"
                              : "bg-orange-600"
                          }`}
                        >
                          {stop.type === "start" ? "✓" : index}
                        </div>

                        {/* Stop details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">
                              {stop.trackingId
                                ? `#${stop.trackingId} - ${stop.address}`
                                : stop.label}
                            </p>

                            <span className="shrink-0 text-xs text-slate-400">
                              {stop.type === "start"
                                ? "Start"
                                : formatTime(stop.eta)}
                            </span>
                          </div>

                          {stop.priority === "EXPRESS" && (
                            <span className="mt-1 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                              EXPRESS
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Blocker notice */}
                {opt.blocker && (
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                    <MapPin
                      size={16}
                      className="mb-1 inline text-amber-600"
                    />{" "}
                    {opt.blocker}
                  </div>
                )}

                {data.refreshedAt && (
                  <p className="text-xs text-slate-400">
                    Last refreshed:{" "}
                    {new Date(data.refreshedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </AdminLayout>
  );
}

