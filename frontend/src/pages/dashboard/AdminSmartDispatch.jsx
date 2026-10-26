import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Package,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import DispatchMap from "../../features/admin/components/DispatchMap";
import { useAuth } from "../../context/AuthContext";

import {
  getSmartDispatch,
  assignSmartRider,
} from "../../services/dispatchApi";

const EMPTY = {
  requests: [],
  parcel: null,
  riders: [],
  excluded: [],
  blocker: null,
  refreshedAt: null,
};

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function priorityLabel(priority) {
  if (priority === "EXPRESS") return "Express";
  if (priority === "STANDARD") return "Standard";
  return "Priority not set";
}

function errorMessage(error) {
  return error.response?.data?.message || "Request failed. Please try again.";
}

export default function AdminSmartDispatch() {
  const { user, logout } = useAuth();

  const [data, setData] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [assigning, setAssigning] = useState(null);

  const assigningRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    setLoading(true);
    setLoadError("");
    setData(EMPTY);

    async function load() {
      try {
        const result = await getSmartDispatch(
          selectedId,
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
        if (!controller.signal.aborted) {
          setLoading(false);

          // Schedule after completion so requests never overlap.
          timer = window.setTimeout(load, 10000);
        }
      }
    }

    load();

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [selectedId, reload]);

  async function assign(rider) {
    if (!data.parcel || assigningRef.current || loadError) return;

    const parcelId = data.parcel.id;

    assigningRef.current = true;
    setAssigning(rider.id);
    setActionError("");
    setNotice("");

    try {
      const result = await assignSmartRider(parcelId, rider.id);
      setNotice(result.message);
      setSelectedId(null);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      assigningRef.current = false;
      setAssigning(null);
      setReload((value) => value + 1);
    }
  }

  function selectParcel(id) {
    if (assigningRef.current) return;

    setSelectedId(id);
    setActionError("");
    setNotice("");
  }

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

        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Operations</p>
            <h1 className="mt-1 text-3xl font-bold">Smart Dispatch 👋</h1>
            <p className="mt-2 text-sm text-slate-500">
              Find suitable riders using location, workload and vehicle capacity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading || assigning !== null}
              onClick={() => setReload((value) => value + 1)}
              aria-label="Refresh dispatch"
              className="rounded-full border border-orange-100 bg-white
                p-3 text-orange-600 disabled:opacity-50"
            >
              <RefreshCw size={18} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#40200f] font-semibold text-white">
              {initials(user?.name || "Admin")}
            </div>

            <div>
              <p className="text-sm font-semibold">{user?.name || "Admin"}</p>
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

        {notice && (
          <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        {(loadError || actionError) && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {loadError || actionError}
          </div>
        )}

        {loading ? (
          <div role="status" className="rounded-3xl bg-white p-12 text-center text-slate-500">
            Loading dispatch data...
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-orange-50 p-5">
                <h2 className="text-sm font-bold">New Delivery Requests</h2>
                <span className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-600">
                  {data.requests.length}
                </span>
              </div>

              <div className="max-h-[700px] overflow-y-auto">
                {!data.requests.length ? (
                  <p className="p-6 text-sm text-slate-500">
                    {loadError
                      ? "Requests could not be loaded."
                      : "No unassigned delivery requests."}
                  </p>
                ) : (
                  data.requests.map((parcel) => (
                    <button
                      type="button"
                      key={parcel.id}
                      onClick={() => selectParcel(parcel.id)}
                      disabled={assigning !== null}
                      aria-pressed={data.parcel?.id === parcel.id}
                      className={`block w-full border-b border-orange-50
                        p-5 text-left transition disabled:opacity-50 ${
                          data.parcel?.id === parcel.id
                            ? "bg-[#fff5e8]"
                            : "hover:bg-orange-50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="break-all text-sm font-semibold">
                          {parcel.trackingId}
                        </span>
                        <span className="text-right text-[11px] text-orange-600">
                          {priorityLabel(parcel.priority)}
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <Package size={13} />
                        {parcel.parcelType} ·{" "}
                        {parcel.parcelWeight == null
                          ? "Weight not set"
                          : `${parcel.parcelWeight} kg`}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {parcel.pickupAddress}
                        <br />→ {parcel.deliveryAddress}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <div className="min-w-0 space-y-6">
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <Sparkles size={18} className="text-orange-500" />
                  Recommended Riders
                </h2>

                {data.blocker && (
                  <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    {data.blocker}
                  </p>
                )}

                {!data.parcel ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Select an available delivery request.
                  </p>
                ) : !data.riders.length ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No eligible riders found. Check GPS, availability,
                    assigned vehicle and remaining capacity.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.riders.map((rider, index) => (
                      <article
                        key={rider.id}
                        className={`flex flex-wrap items-center gap-4
                          rounded-2xl border p-4 ${
                            index === 0
                              ? "border-orange-500 bg-[#fff7ec]"
                              : "border-orange-100"
                          }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#40200f] text-sm font-semibold text-white">
                          {initials(rider.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold">
                              {rider.name}
                            </h3>

                            {index === 0 && (
                              <span className="rounded-full bg-orange-500 px-2 py-1 text-[9px] font-bold text-white">
                                BEST MATCH
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} />
                              {rider.zone || "Zone not set"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Star size={13} className="text-orange-500" />
                              {rider.rating == null
                                ? "No reviews"
                                : Number(rider.rating).toFixed(1)}
                            </span>
                            <span>{rider.workload} active</span>
                            <span>{rider.distanceKm.toFixed(2)} km to pickup</span>
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            {rider.vehicleName} ·{" "}
                            {rider.remainingKg.toFixed(1)} kg available
                            of {rider.capacityKg} kg
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xl font-bold">{rider.score}</p>
                          <p className="text-[10px] text-slate-400">
                            match score
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => assign(rider)}
                          disabled={assigning !== null || Boolean(loadError)}
                          className="rounded-full bg-[#40200f] px-4 py-2
                            text-xs font-semibold text-white hover:bg-[#60351e]
                            disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {assigning === rider.id ? "Assigning..." : "Assign"}
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                {data.excluded.length > 0 && (
                  <details className="mt-5 border-t border-orange-100 pt-4">
                    <summary className="cursor-pointer text-sm text-slate-500">
                      Unavailable riders ({data.excluded.length})
                    </summary>

                    <ul className="mt-3 space-y-2">
                      {data.excluded.map((rider) => (
                        <li key={rider.id} className="text-xs text-slate-500">
                          <span className="font-semibold">{rider.name}:</span>{" "}
                          {rider.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-base font-bold">
                  Rider Locations vs Pickup Point
                </h2>

                {loadError ? (
                  <p className="py-12 text-center text-sm text-slate-500">
                    Live map paused because the latest refresh failed.
                  </p>
                ) : data.parcel && !data.blocker ? (
                  <DispatchMap parcel={data.parcel} riders={data.riders} />
                ) : (
                  <p className="py-12 text-center text-sm text-slate-500">
                    A valid parcel pickup point is required to display the map.
                  </p>
                )}
              </section>

              {data.refreshedAt && (
                <p className="text-xs text-slate-500">
                  Refreshes every 10 seconds · Last refreshed:{" "}
                  {new Date(data.refreshedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}