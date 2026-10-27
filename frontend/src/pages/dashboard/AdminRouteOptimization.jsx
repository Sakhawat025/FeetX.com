import { useEffect, useRef, useState } from "react";

import {
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Route,
} from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import RouteOptimizationMap from "../../features/admin/components/RouteOptimizationMap";

import {
  getRouteOptimization,
  reorderStops,
} from "../../services/routeOptimizationApi";

function number(value) {
  return Number.isFinite(value)
    ? value.toFixed(2)
    : "—";
}

function message(error) {
  return (
    error.response?.data?.message ||
    "Could not load routes. Please retry."
  );
}

function time(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRouteOptimization() {
  const [data, setData] = useState(null);
  const [riderId, setRiderId] = useState(null);
  const [reload, setReload] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("both");
  const [draft, setDraft] = useState([]);
  const [busy, setBusy] = useState(false);

  const request = useRef(0);
  const reorderController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++request.current;

    reorderController.current?.abort();

    setBusy(false);
    setLoading(true);
    setError("");
    setData(null);
    setDraft([]);

    getRouteOptimization(riderId, controller.signal)
      .then((result) => {
        if (request.current !== version) {
          return;
        }

        setData(result);

        setDraft(
          result.optimization?.manualRoute?.sequence.slice(1) ||
            []
        );
      })
      .catch((err) => {
        if (
          request.current === version &&
          !controller.signal.aborted
        ) {
          setError(message(err));
        }
      })
      .finally(() => {
        if (request.current === version) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
      reorderController.current?.abort();
      ++request.current;
    };
  }, [riderId, reload]);

  const opt = data?.optimization;

  const ready =
    !!opt?.manualRoute &&
    !opt.blocker;

  const dirty =
    ready &&
    draft.some(
      (stop, index) =>
        stop.key !==
        opt.manualRoute.sequence[index + 1]?.key
    );

  function moved(index, direction) {
    const next = [...draft];
    const destination = index + direction;

    if (
      destination < 0 ||
      destination >= next.length
    ) {
      return null;
    }

    [next[index], next[destination]] = [
      next[destination],
      next[index],
    ];

    const seen = new Set();

    for (const stop of next) {
      if (
        stop.requires &&
        !seen.has(stop.requires)
      ) {
        return null;
      }

      seen.add(stop.key);
    }

    return next;
  }

  async function recalculate() {
    const version = ++request.current;
    const controller = new AbortController();

    reorderController.current = controller;

    setBusy(true);
    setError("");

    try {
      const result = await reorderStops(
        data.rider.id,
        draft.map((stop) => stop.key),
        controller.signal
      );

      if (request.current !== version) {
        return;
      }

      setData(result);

      setDraft(
        result.optimization?.manualRoute?.sequence.slice(1) ||
          []
      );
    } catch (err) {
      if (
        request.current === version &&
        !controller.signal.aborted
      ) {
        setError(message(err));
      }
    } finally {
      if (request.current === version) {
        setBusy(false);
      }
    }
  }

  const sequence =
    mode === "manual"
      ? opt?.manualRoute?.sequence
      : opt?.optimizedRoute?.sequence;

  return (
    <AdminLayout>
      <section className="min-h-screen bg-[#fdf3e7] p-4 text-[#40200f] sm:p-6 xl:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Operations / Route planning
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Route & Optimization
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Compare the same stops from the same rider GPS
              start.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            disabled={loading || busy}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}

            <button
              type="button"
              onClick={() => {
                setRiderId(null);
                setReload((value) => value + 1);
              }}
              className="ml-2 underline"
            >
              Reload rider list
            </button>
          </div>
        )}

        {loading ? (
          <p
            role="status"
            className="rounded-2xl bg-white p-8"
          >
            Calculating road routes…
          </p>
        ) : (
          <>
            {!!data?.riders?.length && (
              <label className="mb-5 flex items-center gap-3 text-sm font-semibold">
                Rider

                <select
                  value={data.rider?.id || ""}
                  disabled={busy}
                  onChange={(event) =>
                    setRiderId(Number(event.target.value))
                  }
                  className="max-w-full rounded-xl border border-orange-200 bg-white p-3"
                >
                  {data.riders.map((rider) => (
                    <option
                      key={rider.id}
                      value={rider.id}
                    >
                      {rider.name} · {rider.activeDeliveries}{" "}
                      parcels
                      {rider.vehicleName
                        ? ` · ${rider.vehicleName}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {data && !data.rider && (
              <p className="rounded-2xl bg-white p-8">
                No riders with active assigned deliveries.
              </p>
            )}

            {opt?.blocker && (
              <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
              >
                <b>Route cannot be calculated</b>

                <p className="mt-2">
                  {opt.blocker}
                </p>

                <p className="mt-2 text-sm">
                  Distance is unavailable until this is fixed.
                </p>
              </div>
            )}

            {ready && (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                  {[
                    [
                      "Manual route",
                      `${number(opt.manualDistanceKm)} km`,
                      `${number(
                        opt.manualTimeMin
                      )} min estimated driving`,
                      "text-blue-700",
                    ],
                    [
                      "Optimized route",
                      `${number(
                        opt.optimizedDistanceKm
                      )} km`,
                      `${number(
                        opt.estimatedTimeMin
                      )} min estimated driving`,
                      "text-orange-700",
                    ],
                    [
                      "Distance saved",
                      `${number(opt.savingsKm)} km`,
                      `${number(
                        opt.savingsPercent
                      )}% shorter · ~${number(
                        opt.fuelSavedBDT
                      )} BDT fuel saved`,
                      "text-emerald-700",
                    ],
                  ].map(
                    ([label, value, detail, color]) => (
                      <section
                        key={label}
                        className="rounded-2xl bg-white p-5 shadow-sm"
                      >
                        <p
                          className={`text-sm font-semibold ${color}`}
                        >
                          {label}
                        </p>

                        <p
                          className={`my-2 text-3xl font-bold ${color}`}
                        >
                          {value}
                        </p>

                        <p className="text-xs text-slate-500">
                          {detail}
                        </p>
                      </section>
                    )
                  )}
                </div>

                <p className="mb-4 text-sm text-slate-600">
                  {opt.note} {opt.totalStops} stops,
                  excluding start.{" "}
                  {opt.timeSavedMin < 0
                    ? `${number(
                        -opt.timeSavedMin
                      )} min longer driving time on the shorter route.`
                    : `${number(
                        opt.timeSavedMin
                      )} min estimated driving time saved.`}
                </p>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-5">
                    <section className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2 font-bold">
                          <Route size={18} />
                          Road path comparison
                        </h2>

                        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                          {[
                            "both",
                            "manual",
                            "optimized",
                          ].map((value) => (
                            <button
                              type="button"
                              key={value}
                              aria-pressed={mode === value}
                              onClick={() => setMode(value)}
                              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                mode === value
                                  ? "bg-white shadow-sm"
                                  : ""
                              }`}
                            >
                              {value === "both"
                                ? "Compare both"
                                : value === "manual"
                                  ? "Manual"
                                  : "Optimized"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <RouteOptimizationMap
                        manualRoute={opt.manualRoute}
                        optimizedRoute={opt.optimizedRoute}
                        mode={mode}
                        riderName={data.rider.name}
                      />

                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <span className="font-semibold text-blue-700">
                          Blue dashed: Manual
                        </span>

                        <span className="font-semibold text-orange-700">
                          Orange: Optimized
                        </span>

                        <span className="text-slate-500">
                          Markers follow{" "}
                          {mode === "manual"
                            ? "manual"
                            : "optimized"}{" "}
                          stop order. S = GPS start.
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        {opt.distanceSource}. Open route, no
                        return trip. Paths can share roads;
                        switch views to inspect each. Times
                        exclude traffic and stop handling.
                        Fuel estimate: 4.50 BDT/km.
                      </p>
                    </section>

                    <section className="rounded-2xl bg-white p-5 shadow-sm">
                      <h2 className="font-bold">
                        Manual stop order
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Initially ordered by assignment time.
                        Move stops and recalculate to compare.
                        Pickup must stay before its delivery.
                        This is a planning preview, not a
                        saved rider dispatch.
                      </p>

                      <ol className="my-4 space-y-2">
                        {draft.map((stop, index) => (
                          <li
                            key={stop.key}
                            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                          >
                            <span className="font-bold text-blue-700">
                              {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                {stop.label}
                              </p>

                              <p className="break-words text-xs text-slate-500">
                                {stop.address}
                              </p>
                            </div>

                            {[-1, 1].map((direction) => (
                              <button
                                type="button"
                                key={direction}
                                disabled={
                                  busy ||
                                  !moved(index, direction)
                                }
                                onClick={() =>
                                  setDraft(
                                    moved(index, direction)
                                  )
                                }
                                aria-label={`Move ${
                                  stop.label
                                } ${
                                  direction === -1
                                    ? "up"
                                    : "down"
                                }`}
                                className="rounded-lg border p-2 disabled:opacity-25"
                              >
                                {direction === -1 ? (
                                  <ArrowUp size={15} />
                                ) : (
                                  <ArrowDown size={15} />
                                )}
                              </button>
                            ))}
                          </li>
                        ))}
                      </ol>

                      {dirty && (
                        <p
                          role="status"
                          className="mb-3 text-sm text-amber-700"
                        >
                          Order changed. Map and distances
                          still show the last calculation.
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={busy || !dirty}
                        onClick={recalculate}
                        className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        {busy
                          ? "Calculating…"
                          : "Recalculate comparison"}
                      </button>
                    </section>
                  </div>

                  <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-bold">
                      {mode === "manual"
                        ? "Manual"
                        : "Optimized"}{" "}
                      stop sequence
                    </h2>

                    <ol className="mt-4 space-y-3">
                      {sequence.map((stop) => (
                        <li
                          key={stop.key}
                          className="flex gap-3 border-b border-slate-100 pb-3"
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                              stop.type === "start"
                                ? "bg-emerald-600"
                                : mode === "manual"
                                  ? "bg-blue-600"
                                  : "bg-orange-600"
                            }`}
                          >
                            {stop.type === "start"
                              ? "S"
                              : stop.order}
                          </span>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {stop.label}
                            </p>

                            <p className="mt-1 break-words text-xs text-slate-500">
                              {stop.address}
                            </p>

                            {stop.type !== "start" && (
                              <p className="mt-2 text-xs text-slate-600">
                                +
                                {number(
                                  stop.distanceFromPrev
                                )}{" "}
                                km · Driving ETA{" "}
                                {time(stop.eta)} 
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>

                    <p className="mt-4 text-xs text-slate-400">
                      Calculated: {time(data.refreshedAt)}
                    </p>
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  );
}