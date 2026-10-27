import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Download,
  Printer,
  RefreshCw,
  LogOut,
} from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

import {
  getReports,
  downloadCSV,
} from "../../services/reportsApi";

import "../../styles/adminReports.css";

const TABS = [
  "Delivery Reports",
  "Rider Reports",
  "Cost Analysis",
  "Performance Reports",
];

function fmt(value, digits = 1) {
  return value == null
    ? "N/A"
    : Number(value).toLocaleString("en-US", {
        maximumFractionDigits: digits,
      });
}

function stamp(value) {
  return value
    ? new Date(value).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
      })
    : "N/A";
}

function defaults() {
  const to = new Date(Date.now() + 21600000)
    .toISOString()
    .slice(0, 10);

  const from = new Date(
    new Date(`${to}T00:00:00Z`).getTime() -
      27 * 86400000
  )
    .toISOString()
    .slice(0, 10);

  return {
    from,
    to,
    riderId: "",
    rate: "4.5",
  };
}

function Chart({ rows, series, bars = false }) {
  const width = Math.max(600, rows.length * 26);
  const height = 240;

  const left = 48;
  const right = width - 48;
  const top = 30;
  const bottom = 195;

  const maxima = series.map(
    (item) =>
      Math.max(
        1,
        ...rows.map((row) => row[item.key] ?? 0)
      ) * 1.15
  );

  if (bars) {
    maxima.fill(Math.max(...maxima));
  }

  const x = (index) =>
    left +
    ((index + 0.5) * (right - left)) /
      Math.max(rows.length, 1);

  const y = (value, seriesIndex) =>
    bottom -
    (value / maxima[seriesIndex]) * (bottom - top);

  return (
    <div>
      <div className="report-chart-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: width }}
          role="img"
          aria-label={series
            .map((item) => item.label)
            .join(" and ")}
        >
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={right}
                y1={bottom - (tick * (bottom - top)) / 4}
                y2={bottom - (tick * (bottom - top)) / 4}
                stroke="#f4ddca"
                strokeDasharray="3 3"
              />

              <text
                x={left - 8}
                y={bottom - (tick * (bottom - top)) / 4 + 4}
                textAnchor="end"
              >
                {fmt((maxima[0] * tick) / 4, 0)}
              </text>

              {!bars && series.length > 1 && (
                <text
                  x={right + 8}
                  y={
                    bottom -
                    (tick * (bottom - top)) / 4 +
                    4
                  }
                >
                  {fmt((maxima[1] * tick) / 4, 0)}
                </text>
              )}
            </g>
          ))}

          {series.map((item, seriesIndex) => (
            <g key={item.key}>
              {!bars &&
                rows.slice(1).map((row, index) =>
                  row[item.key] != null &&
                  rows[index][item.key] != null ? (
                    <line
                      key={index}
                      x1={x(index)}
                      y1={y(
                        rows[index][item.key],
                        seriesIndex
                      )}
                      x2={x(index + 1)}
                      y2={y(
                        row[item.key],
                        seriesIndex
                      )}
                      stroke={item.color}
                      strokeWidth="2.5"
                    />
                  ) : null
                )}

              {rows.map((row, index) =>
                row[item.key] == null ? null : bars ? (
                  <rect
                    key={index}
                    x={x(index) + (seriesIndex ? 1 : -10)}
                    y={y(row[item.key], seriesIndex)}
                    width="9"
                    height={
                      bottom -
                      y(row[item.key], seriesIndex)
                    }
                    rx="2"
                    fill={item.color}
                  >
                    <title>
                      {row.date || row.label}: {item.label}{" "}
                      {fmt(row[item.key])}
                    </title>
                  </rect>
                ) : (
                  <circle
                    key={index}
                    cx={x(index)}
                    cy={y(row[item.key], seriesIndex)}
                    r="3.5"
                    fill="white"
                    stroke={item.color}
                    strokeWidth="2"
                  >
                    <title>
                      {row.from} to {row.to}: {item.label}{" "}
                      {fmt(row[item.key])}
                    </title>
                  </circle>
                )
              )}
            </g>
          ))}

          {rows.map((row, index) => (
            <text
              key={index}
              x={x(index)}
              y={bottom + 22}
              textAnchor="middle"
            >
              {row.label || row.date.slice(5)}
            </text>
          ))}
        </svg>
      </div>

      <div className="report-legend">
        {series.map((item, index) => (
          <span
            key={item.key}
            style={{ color: item.color }}
          >
            ● {item.label}
            {!bars
              ? ` (${index ? "right" : "left"} axis)`
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Table({ columns, rows, action }) {
  const [page, setPage] = useState(0);

  const pages = Math.max(1, Math.ceil(rows.length / 15));
  const current = Math.min(page, pages - 1);

  function table(list) {
    return (
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}

            {action && (
              <th className="no-print">Report</th>
            )}
          </tr>
        </thead>

        <tbody>
          {list.length ? (
            list.map((row, index) => (
              <tr
                key={
                  row.id ??
                  row.date ??
                  row.label ??
                  index
                }
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row[column.key])
                      : row[column.key] ?? "N/A"}
                  </td>
                ))}

                {action && (
                  <td className="no-print">
                    <button
                      className="report-small"
                      onClick={() => action(row)}
                    >
                      ↓ CSV
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={
                  columns.length + (action ? 1 : 0)
                }
              >
                No records for these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  return (
    <>
      <div className="report-table no-print">
        {table(
          rows.slice(current * 15, (current + 1) * 15)
        )}
      </div>

      {/* Print includes all rows, not just the current page. */}
      <div className="report-print-only">
        {table(rows)}
      </div>

      <div className="report-pagination no-print">
        <span>
          {rows.length} records · Page {current + 1} of{" "}
          {pages}
        </span>

        <div>
          <button
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>

          <button
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

const count = (key, label) => ({
  key,
  label,
  render: (value) => fmt(value, 0),
});

const metric = (key, label) => ({
  key,
  label,
  render: (value) => fmt(value, 2),
});

const riderColumns = [
  { key: "name", label: "Rider" },
  count("bookings", "Bookings"),
  count("completed", "Completed"),
  metric("onTimeRate", "On-time %"),
  count("timedCount", "With deadline"),
  metric("avgMinutes", "Avg minutes"),
  metric("rating", "Rating / 5"),
];

const costColumns = [
  { key: "name", label: "Rider" },
  count("completed", "Completed"),
  count("distanceCount", "With coordinates"),
  count("missingDistance", "Missing coordinates"),
  metric("totalKm", "Est. straight-line km"),
  metric("estimatedCost", "Est. cost BDT"),
  metric(
    "costPerMeasuredDelivery",
    "BDT / measured delivery"
  ),
];

const performanceColumns = [
  { key: "name", label: "Rider" },
  count("completed", "Completed"),
  count("onTime", "On time"),
  count("late", "Late"),
  count("timedCount", "With deadline"),
  metric("onTimeRate", "On-time %"),
  metric("avgMinutes", "Avg minutes"),
  count("durationCount", "Timed samples"),
  metric("rating", "Rating / 5"),
  count("reviewCount", "Reviews"),
];

const deliveryColumns = [
  { key: "trackingId", label: "Tracking ID" },
  { key: "rider", label: "Rider" },
  { key: "status", label: "Current status" },
  { key: "priority", label: "Priority" },
  {
    key: "createdAt",
    label: "Booked (Dhaka)",
    render: stamp,
  },
  {
    key: "deliveredAt",
    label: "Delivered (Dhaka)",
    render: stamp,
  },
];

export default function AdminReports() {
  const { user, logout } = useAuth();

  const [form, setForm] = useState(defaults);
  const [filters, setFilters] = useState(form);
  const [tab, setTab] = useState(0);
  const [revision, setRevision] = useState(0);

  const [data, setData] = useState(null);
  const [riders, setRiders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setData(null);

    getReports(filters, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setRiders(result.riders);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.message ||
              "Could not load reports. Please retry."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [filters, revision]);

  const dirty =
    JSON.stringify(form) !== JSON.stringify(filters);

  const summary = data?.summary;

  const columns = [
    deliveryColumns,
    riderColumns,
    costColumns,
    performanceColumns,
  ][tab];

  const rows = data
    ? tab === 0
      ? data.deliveries
      : data.performance
    : [];

  function update(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function exportRows(cols, items, suffix) {
    downloadCSV(
      `FleetX-${suffix}-${data.filters.from}-${data.filters.to}.csv`,

      cols.map((column) => column.label),

      items.map((row) =>
        cols.map((column) =>
          column.render
            ? column.render(row[column.key])
            : row[column.key]
        )
      ),

      [
        ["FleetX", TABS[tab]],
        [
          "Period",
          data.filters.from,
          data.filters.to,
          "Asia/Dhaka",
        ],
        ["Generated", stamp(data.generatedAt)],
        [
          "Rider filter",
          data.riders.find(
            (rider) => rider.id === data.filters.riderId
          )?.name || "All riders",
        ],
        [
          "Basis",
          "Bookings use creation date/current status; completed metrics use completion date.",
        ],
        [
          "Cost basis",
          "Straight-line pickup-to-dropoff estimate, not road mileage or actual expense. BDT/km",
          data.filters.rate,
        ],
        [],
      ]
    );
  }

  function exportRider(row) {
    exportRows(
      [
        ...performanceColumns,
        ...costColumns.slice(2),
      ],
      [row],
      `rider-${row.id ?? "unassigned"}`
    );
  }

  return (
    <AdminLayout>
      <section className="reports-page">
        <header className="report-header">
          <div>
            <Link
              className="no-print report-back"
              to="/admin/dashboard"
            >
              ← Dashboard
            </Link>

            <p>Operations</p>
            <h1>Reports 👋</h1>
            <p>Generate and export operational reports.</p>
          </div>

          <div className="report-account no-print">
            <span>{user?.name || "Admin"}</span>

            <button
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="report-toolbar no-print">
          <nav aria-label="Report type">
            {TABS.map((name, index) => (
              <button
                key={name}
                aria-pressed={tab === index}
                className={tab === index ? "active" : ""}
                onClick={() => setTab(index)}
              >
                {name}
              </button>
            ))}
          </nav>

          <div className="report-actions">
            <button
              disabled={!data || loading || dirty}
              onClick={() =>
                exportRows(
                  columns,
                  rows,
                  `report-${tab + 1}`
                )
              }
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              disabled={!data || loading || dirty}
              onClick={() => window.print()}
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
          </div>
        </div>

        <form
          className="report-filters no-print"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({ ...form });
          }}
        >
          <label>
            From
            <input
              type="date"
              required
              value={form.from}
              onChange={(event) =>
                update("from", event.target.value)
              }
            />
          </label>

          <label>
            To
            <input
              type="date"
              required
              min={form.from}
              max={defaults().to}
              value={form.to}
              onChange={(event) =>
                update("to", event.target.value)
              }
            />
          </label>

          <label>
            Rider
            <select
              value={form.riderId}
              onChange={(event) =>
                update("riderId", event.target.value)
              }
            >
              <option value="">All riders</option>

              {riders.map((rider) => (
                <option
                  key={rider.id}
                  value={rider.id}
                >
                  {rider.name}
                  {rider.status ? "" : " (disabled)"}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estimated BDT/km
            <input
              type="number"
              min="0"
              max="1000"
              step="0.01"
              required
              value={form.rate}
              onChange={(event) =>
                update("rate", event.target.value)
              }
            />
          </label>

          <button
            className="report-primary"
            disabled={loading}
          >
            Apply filters
          </button>

          <button
            type="button"
            disabled={loading || dirty}
            onClick={() =>
              setRevision((value) => value + 1)
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              const next = defaults();

              setForm(next);
              setFilters(next);
            }}
          >
            Reset
          </button>
        </form>

        {dirty && (
          <p className="report-notice no-print">
            Filters changed. Apply filters to update the
            report and enable export.
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="report-error"
          >
            {error}

            <button
              onClick={() =>
                setRevision((value) => value + 1)
              }
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <p
            role="status"
            className="report-card"
          >
            Generating report…
          </p>
        )}

        {data && (
          <>
            <p className="report-period">
              <b>{TABS[tab]}</b> · {data.filters.from} to{" "}
              {data.filters.to} · Asia/Dhaka ·{" "}
              {data.riders.find(
                (rider) =>
                  rider.id === data.filters.riderId
              )?.name || "All riders"}{" "}
              · Generated {stamp(data.generatedAt)}
            </p>

            <div className="report-stats">
              {[
                [
                  "Bookings in period",
                  fmt(summary.bookings, 0),
                ],
                [
                  "Completed in period",
                  fmt(summary.completed, 0),
                ],
                [
                  "On-time delivery",
                  summary.onTimeRate === null
                    ? "N/A"
                    : `${fmt(summary.onTimeRate)}%`,
                ],
                [
                  tab === 2
                    ? "Estimated cost (BDT)"
                    : "Avg assignment-to-delivery",

                  tab === 2
                    ? fmt(summary.estimatedCost, 2)
                    : summary.avgMinutes === null
                      ? "N/A"
                      : `${fmt(summary.avgMinutes)} min`,
                ],
              ].map(([label, value]) => (
                <article key={label}>
                  <p>{label}</p>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>

            <div className="report-notes">
              <p>
                Bookings and the bar chart use creation date
                and current status. Completion, rider and
                performance metrics use delivered date,
                including older bookings completed in this
                period. Cancellation date is not stored.
              </p>

              <p>
                On-time rate uses {summary.timedCount}{" "}
                completed deliveries with deadlines.
                Duration uses {summary.durationCount} valid
                assignment-to-delivery samples; it is not
                driving time. N/A means no eligible data.
              </p>

              <p>
                Cost/distance figures are straight-line
                estimates, not actual road mileage or
                expenses. {summary.distanceCount} of{" "}
                {summary.completed} completions have valid
                coordinates; {summary.missingDistance} are
                excluded. Rate:{" "}
                {fmt(data.filters.rate, 2)} BDT/km. Saved
                optimization history is not available.
              </p>
            </div>

            {tab === 0 && (
              <div className="report-charts">
                <section className="report-card">
                  <h2>
                    Delivery Reports · Booking-date overview
                  </h2>

                  <Chart
                    rows={data.daily}
                    bars
                    series={[
                      {
                        key: "delivered",
                        label: "Delivered bookings",
                        color: "#df7317",
                      },
                      {
                        key: "cancelled",
                        label: "Cancelled bookings",
                        color: "#f8a15a",
                      },
                    ]}
                  />
                </section>

                <section className="report-card">
                  <h2>
                    Distance & Fulfilment Time · Weekly
                  </h2>

                  <Chart
                    rows={data.trend}
                    series={[
                      {
                        key: "avgKm",
                        label: "Est. distance (km)",
                        color: "#ef791b",
                      },
                      {
                        key: "avgMinutes",
                        label: "Avg fulfilment (min)",
                        color: "#482712",
                      },
                    ]}
                  />
                </section>
              </div>
            )}

            {tab === 2 && (
              <section className="report-card">
                <h2>Estimated cost by week</h2>

                <Chart
                  rows={data.trend}
                  series={[
                    {
                      key: "estimatedCost",
                      label: "Est. cost (BDT)",
                      color: "#df7317",
                    },
                  ]}
                />

                <Table
                  key={`weekly-${data.generatedAt}`}
                  columns={[
                    { key: "from", label: "From" },
                    { key: "to", label: "To" },
                    count("distanceCount", "Measured"),
                    metric("totalKm", "Est. km"),
                    metric("estimatedCost", "Est. BDT"),
                  ]}
                  rows={data.trend}
                />
              </section>
            )}

            {tab === 3 && (
              <section className="report-card">
                <h2>On-time performance · Weekly</h2>

                <Chart
                  rows={data.trend}
                  series={[
                    {
                      key: "onTimeRate",
                      label: "On-time (%)",
                      color: "#df7317",
                    },
                  ]}
                />
              </section>
            )}

            {tab === 0 && (
              <section className="report-card">
                <h2>Rider Performance Summary</h2>

                <Table
                  key={`summary-${data.generatedAt}`}
                  columns={riderColumns}
                  rows={data.performance}
                  action={dirty ? null : exportRider}
                />
              </section>
            )}

            <section className="report-card">
              <h2>
                {
                  [
                    "Booking Details",
                    "Rider Reports",
                    "Estimated Cost by Rider",
                    "Rider Performance Details",
                  ][tab]
                }
              </h2>

              <Table
                key={`${tab}-${data.generatedAt}`}
                columns={columns}
                rows={rows}
                action={
                  tab !== 0 && !dirty
                    ? exportRider
                    : undefined
                }
              />
            </section>
          </>
        )}
      </section>
    </AdminLayout>
  );
}