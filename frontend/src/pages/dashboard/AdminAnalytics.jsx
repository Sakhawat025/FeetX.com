import { useEffect, useState } from "react";
import {
  TrendingUp,
  Clock3,
  Gauge,
  Star,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";
import AdminLayout from "../../features/admin/components/AdminLayout";

const ORANGE = "#df7517";
const LIGHT_ORANGE = "#f8ab70";
const BROWN = "#42200e";

function format(value, suffix = "") {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}${suffix}`;
}

function changeText(value, unit) {
  if (value === null || value === undefined) {
    return "Previous-period data unavailable";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${format(value)} ${unit} vs previous 30 days`;
}

function Card({ title, children }) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-5 shadow-sm">
      {title && (
        <h2 className="mb-5 text-sm font-bold text-[#42200e]">
          {title}
        </h2>
      )}

      {children}
    </section>
  );
}

function StatCard({ title, value, note, icon: Icon, color }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#42200e]">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>
        </div>
      </div>
    </Card>
  );
}

function Legend({ items }) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
      {items.map(([name, color]) => (
        <span key={name} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: color }}
          />
          {name}
        </span>
      ))}
    </div>
  );
}

function DailyChart({ data }) {
  const maximum = Math.max(
    1,
    ...data.flatMap((item) => [item.delivered, item.cancelled])
  );

  const top = Math.max(4, Math.ceil(maximum / 4) * 4);
  const bottom = 220;
  const plotHeight = 180;

  return (
    <>
      <svg
        viewBox="0 0 680 260"
        className="h-64 w-full"
        role="img"
        aria-label="Delivered and cancelled parcel counts by booking date"
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const value = (top / 4) * index;
          const y = bottom - (value / top) * plotHeight;

          return (
            <g key={index}>
              <line
                x1="45"
                x2="660"
                y1={y}
                y2={y}
                stroke="#f2e5d8"
                strokeDasharray="3 4"
              />
              <text
                x="35"
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#8795a6"
              >
                {value}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const x = 65 + index * 86;

          return (
            <g key={item.date}>
              {[
                ["delivered", ORANGE, 0],
                ["cancelled", LIGHT_ORANGE, 27],
              ].map(([key, color, offset]) => {
                const height = (item[key] / top) * plotHeight;

                return (
                  <rect
                    key={key}
                    x={x + offset}
                    y={bottom - height}
                    width="24"
                    height={height}
                    rx="4"
                    fill={color}
                  >
                    <title>
                      {item.date}: {key} {item[key]}
                    </title>
                  </rect>
                );
              })}

              <text
                x={x + 25}
                y="244"
                textAnchor="middle"
                fontSize="11"
                fill="#8795a6"
              >
                {item.day}
              </text>
            </g>
          );
        })}
      </svg>

      <Legend
        items={[
          ["Delivered", ORANGE],
          ["Cancelled", LIGHT_ORANGE],
        ]}
      />

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Parcels booked on each day, grouped by their current status.
        This is not a cancellation-time activity log.
      </p>
    </>
  );
}

function FleetChart({ fleet }) {
  const total = fleet.total;

  const activeEnd = total ? (fleet.active / total) * 100 : 0;
  const idleEnd = total ? ((fleet.active + fleet.idle) / total) * 100 : 0;

  const background = total
    ? `conic-gradient(
        ${ORANGE} 0% ${activeEnd}%,
        ${BROWN} ${activeEnd}% ${idleEnd}%,
        ${LIGHT_ORANGE} ${idleEnd}% 100%
      )`
    : "#edf0f3";

  return (
    <>
      <div
        className="mx-auto my-7 grid h-40 w-40 place-items-center rounded-full"
        style={{ background }}
        role="img"
        aria-label={`${fleet.active} active, ${fleet.idle} idle, ${fleet.disabled} disabled riders`}
      >
        <div className="grid h-28 w-28 place-content-center rounded-full bg-white text-center">
          <strong className="text-2xl text-[#42200e]">
            {fleet.total}
          </strong>
          <span className="text-xs text-slate-400">Riders</span>
        </div>
      </div>

      <Legend
        items={[
          [`Active (${fleet.active})`, ORANGE],
          [`Idle (${fleet.idle})`, BROWN],
          [`Disabled (${fleet.disabled})`, LIGHT_ORANGE],
        ]}
      />

      <p className="mt-5 text-xs leading-5 text-slate-400">
        Active means an enabled rider sharing GPS updated within
        the last 2 minutes. Idle means an enabled rider without
        recent shared GPS. Utilization excludes disabled accounts.
      </p>
    </>
  );
}

function TrendChart({ data }) {
  const series = [
    { key: "avgDistanceKm", color: ORANGE, unit: "km" },
    { key: "avgMinutes", color: BROWN, unit: "min" },
  ];

  const maximumFor = (key) =>
    Math.max(1, ...data.map((item) => item[key] ?? 0));

  function pathFor(key) {
    const maximum = maximumFor(key);
    let open = false;

    return data
      .map((item, index) => {
        if (item[key] === null) {
          open = false;
          return "";
        }

        const x = 60 + index * 180;
        const y = 220 - (item[key] / maximum) * 170;
        const command = open ? "L" : "M";

        open = true;

        return `${command} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <>
      <svg
        viewBox="0 0 660 265"
        className="h-64 w-full"
        role="img"
        aria-label="Four-week average straight-line distance and delivery time with separate scales"
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const fraction = index / 4;
          const y = 220 - fraction * 170;

          return (
            <g key={index}>
              <line
                x1="60"
                x2="600"
                y1={y}
                y2={y}
                stroke="#f2e5d8"
                strokeDasharray="3 4"
              />
              <text
                x="49"
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill={ORANGE}
              >
                {format(maximumFor("avgDistanceKm") * fraction)}
              </text>
              <text
                x="611"
                y={y + 4}
                fontSize="10"
                fill={BROWN}
              >
                {format(maximumFor("avgMinutes") * fraction)}
              </text>
            </g>
          );
        })}

        <text x="20" y="22" fontSize="11" fill={ORANGE}>
          km
        </text>
        <text x="610" y="22" fontSize="11" fill={BROWN}>
          min
        </text>

        {series.map(({ key, color, unit }) => (
          <g key={key}>
            <path
              d={pathFor(key)}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            {data.map((item, index) => {
              if (item[key] === null) return null;

              return (
                <circle
                  key={item.week}
                  cx={60 + index * 180}
                  cy={220 - (item[key] / maximumFor(key)) * 170}
                  r="4"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                >
                  <title>
                    {item.from} to {item.to}:{" "}
                    {format(item[key], ` ${unit}`)}
                  </title>
                </circle>
              );
            })}
          </g>
        ))}

        {data.map((item, index) => (
          <text
            key={item.week}
            x={60 + index * 180}
            y="247"
            textAnchor="middle"
            fontSize="11"
            fill="#8795a6"
          >
            {item.week}
          </text>
        ))}
      </svg>

      <Legend
        items={[
          ["Avg straight-line distance · left axis", ORANGE],
          ["Avg delivery time · right axis", BROWN],
        ]}
      />

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Four consecutive 7-day periods, oldest to newest. Distance uses
        pickup/destination coordinates. Time runs from assignment to
        delivery. Missing measurements are omitted.
      </p>

      {!data.some(
        (item) =>
          item.avgDistanceKm !== null || item.avgMinutes !== null
      ) && (
        <p className="mt-3 text-sm text-slate-400">
          No measured completed deliveries yet.
        </p>
      )}
    </>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let timer;
    const controller = new AbortController();

    setLoading(true);
    setError("");

    async function load() {
      try {
        const response = await api.get("/admin/analytics", {
          signal: controller.signal,
          timeout: 15000,
        });

        if (active) {
          setData(response.data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setData(null);
          setError(
            err.response?.data?.message ||
              "Analytics could not be loaded."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = window.setTimeout(load, 30000);
        }
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [version]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#fff4e8] p-4 sm:p-6 xl:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Operations</p>
            <h1 className="mt-1 text-2xl font-bold text-[#42200e]">
              Analytics 👋
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Delivery performance, rider efficiency and fleet workload.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => setVersion((value) => value + 1)}
            className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-[#42200e] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {loading && !data && (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-400">
            Loading analytics…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl bg-red-50 p-5 text-sm text-red-700"
          >
            {error} Use Refresh to try again.
          </div>
        )}

        {data && (
          <>
            <p className="mb-4 text-xs text-slate-500">
              Performance period: {data.period.from} to {data.period.to} ·
              Bangladesh time · Auto-refresh every 30 seconds
            </p>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="On-Time Rate"
                value={format(data.summary.onTimeRate, "%")}
                note={changeText(
                  data.summary.onTimeChange,
                  "percentage points"
                )}
                icon={TrendingUp}
                color="bg-emerald-50 text-emerald-600"
              />

              <StatCard
                title="Avg Delivery Time"
                value={format(data.summary.avgMinutes, " min")}
                note={changeText(data.summary.minutesChange, "min")}
                icon={Clock3}
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Fleet Utilization"
                value={format(data.fleet.utilization, "%")}
                note={`${data.fleet.active} of ${data.fleet.enabled} enabled riders sharing recent GPS`}
                icon={Gauge}
                color="bg-orange-50 text-orange-600"
              />

              <StatCard
                title="Avg Rider Rating"
                value={format(data.summary.rating)}
                note={`Based on ${data.summary.reviewCount} rated deliveries in this period`}
                icon={Star}
                color="bg-violet-50 text-violet-600"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <Card title="Daily Delivery Chart">
                <DailyChart data={data.daily} />
              </Card>

              <Card title="Fleet Utilization">
                <FleetChart fleet={data.fleet} />
              </Card>
            </div>

            <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
              <Card title="Route Efficiency Trend">
                <TrendChart data={data.trend} />
              </Card>

              <Card title="Rider Performance">
                <div className="max-h-[350px] overflow-y-auto">
                  {data.performance.length === 0 && (
                    <p className="py-10 text-center text-sm text-slate-400">
                      No riders found.
                    </p>
                  )}

                  {data.performance.map((rider) => (
                    <div
                      key={rider.id}
                      className="flex items-center justify-between gap-4 border-b border-orange-50 py-4 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#42200e]">
                          {rider.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {rider.completed} completed deliveries
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          {format(rider.onTimeRate, "%")}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          on-time · {rider.timedCount} measured
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              “—” means there is no eligible measurement. KPI calculations
              exclude missing timestamps and ratings. Fleet workload is
              current; performance metrics use completed deliveries in the
              displayed period.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}