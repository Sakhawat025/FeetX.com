import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Filter, Search, X } from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminParcels,
  getAdminParcel,
  updateParcelPriority,
} from "../../services/adminParcelApi";

const STATUS = {
  PENDING: ["Pending", "bg-violet-100 text-violet-600"],
  CONFIRMED: ["Confirmed", "bg-blue-100 text-blue-600"],
  PICKED_UP: ["Picked Up", "bg-amber-100 text-amber-700"],
  OUT_FOR_DELIVERY: ["Out for Delivery", "bg-orange-100 text-orange-600"],
  DELIVERED: ["Delivered", "bg-emerald-100 text-emerald-600"],
  CANCELLED: ["Cancelled", "bg-red-100 text-red-600"],
  RETURNED: ["Returned", "bg-gray-100 text-gray-600"],
};

const TABS = [
  ["", "All"],
  ["PENDING", "Pending"],
  ["OUT_FOR_DELIVERY", "Out for Delivery"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
];

const INPUT =
  "w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 " +
  "text-sm text-slate-700 outline-none focus:border-orange-500";

function errorMessage(error) {
  return error.response?.data?.message || "Request failed. Please try again.";
}

function priorityLabel(value) {
  return value === "EXPRESS"
    ? "Express"
    : value === "STANDARD"
    ? "Standard"
    : "Not set";
}

function dateTime(value) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

function StatusBadge({ value }) {
  const [label, style] = STATUS[value] || [value, "bg-gray-100 text-gray-600"];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap
        rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ParcelDetails({ id, onClose, onChanged }) {
  const dialogRef = useRef(null);
  const savingRef = useRef(false);

  const [parcel, setParcel] = useState(null);
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getAdminParcel(id, controller.signal);

        if (!controller.signal.aborted) {
          setParcel(result);
          setPriority(result.priority || "");
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(errorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, retry]);

  async function save(event) {
    event.preventDefault();
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await updateParcelPriority(id, priority || null);
      setParcel(result);
      setNotice("Priority updated.");
      onChanged();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const details = parcel
    ? [
        ["Sender", parcel.senderName],
        ["Receiver", parcel.receiverName],
        ["Receiver phone", parcel.receiverPhone],
        ["Parcel type", parcel.parcelType],
        ["Pickup address", parcel.pickupAddress],
        ["Delivery address", parcel.deliveryAddress],
        [
          "Weight",
          parcel.parcelWeight == null ? null : `${parcel.parcelWeight} kg`,
        ],
        ["Assigned rider", parcel.rider?.name || "Unassigned"],
        ["Rider phone", parcel.rider?.phone],
        ["Created", dateTime(parcel.createdAt)],
        ["Assigned", dateTime(parcel.assignedAt)],
        ["Due", dateTime(parcel.dueAt)],
        ["Delivered", dateTime(parcel.deliveredAt)],
      ]
    : [];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="parcel-details-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!savingRef.current) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl
        overflow-y-auto rounded-3xl bg-white p-0 text-[#40200f]
        shadow-xl backdrop:bg-black/40"
    >
      <header className="flex items-center justify-between border-b border-orange-100 p-6">
        <div>
          <h2 id="parcel-details-title" className="text-xl font-bold">
            Parcel Details
          </h2>
          {parcel && (
            <p className="mt-1 text-sm text-slate-500">
              {parcel.trackingId}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close parcel details"
          className="rounded-lg p-2 hover:bg-orange-50 disabled:opacity-50"
        >
          <X size={22} />
        </button>
      </header>

      <div className="p-6">
        {loading ? (
          <p role="status" className="py-8 text-center text-slate-500">
            Loading parcel...
          </p>
        ) : parcel ? (
          <>
            <StatusBadge value={parcel.status} />

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-slate-700">
                    {value || "Not recorded"}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-xs text-slate-400">
              All times are shown in Bangladesh time.
            </p>

            <form
              onSubmit={save}
              className="mt-6 flex flex-wrap items-end gap-3 border-t border-orange-100 pt-5"
            >
              <label className="min-w-[180px] flex-1 text-sm font-medium">
                Priority
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  disabled={saving}
                  className={`${INPUT} mt-2`}
                >
                  <option value="">Not set</option>
                  <option value="STANDARD">Standard</option>
                  <option value="EXPRESS">Express</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={saving || priority === (parcel.priority || "")}
                className="rounded-xl bg-[#40200f] px-5 py-3 text-sm
                  font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Priority"}
              </button>
            </form>

            {notice && (
              <p role="status" className="mt-3 text-sm text-emerald-600">
                {notice}
              </p>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="text-sm font-semibold text-orange-600 underline"
          >
            Retry loading details
          </button>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}

export default function AdminParcels() {
  const { user, logout } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignment: "",
    page: 1,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState({
    parcels: [],
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previous) =>
        previous.search === searchInput
          ? previous
          : { ...previous, search: searchInput, page: 1 }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getAdminParcels(filters, controller.signal);

        if (controller.signal.aborted) return;

        if (filters.page > result.totalPages) {
          setFilters((previous) => ({
            ...previous,
            page: result.totalPages,
          }));
          return;
        }

        setData(result);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(errorMessage(requestError));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [filters, reload]);

  function filter(key, value) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: 1,
    }));
  }

  function resetFilters() {
    setSearchInput("");
    setFilters({
      search: "",
      status: "",
      priority: "",
      assignment: "",
      page: 1,
    });
  }

  return (
    <AdminLayout>
      <section className="min-h-screen bg-[#fdf3e7] p-4 text-[#40200f] sm:p-6 xl:p-9">
        <Link
          to="/admin/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm lg:hidden"
        >
          <ArrowLeft size={17} />
          Dashboard
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-base text-slate-500">Operations</p>
            <h1 className="mt-1 text-3xl font-bold">Parcels 👋</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              All parcels across the delivery pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#40200f] font-bold text-white">
              {(user?.name || "A").charAt(0).toUpperCase()}
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

        <div className="my-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" aria-label="Parcel status filters">
            {TABS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={filters.status === value}
                onClick={() => filter("status", value)}
                className={`rounded-[20px] border px-4 py-3 text-sm font-semibold ${
                  filters.status === value
                    ? "border-[#40200f] bg-[#40200f] text-white"
                    : "border-orange-100 bg-white text-slate-500 hover:bg-orange-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-[310px]">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="Search parcel ID or receiver"
                placeholder="Search parcel ID or receiver..."
                value={searchInput}
                maxLength={150}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-[20px] border border-orange-100
                  bg-white py-3 pl-11 pr-4 text-sm outline-none
                  placeholder:text-slate-400 focus:border-orange-400"
              />
            </div>

            <button
              type="button"
              aria-expanded={showFilters}
              aria-controls="parcel-filter-panel"
              onClick={() => setShowFilters((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-[20px]
                border border-orange-500 px-4 py-3 text-sm
                font-semibold text-orange-600 hover:bg-orange-50"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        {showFilters && (
          <div
            id="parcel-filter-panel"
            className="mb-6 grid items-end gap-4 rounded-2xl
              border border-orange-100 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            <label className="text-sm text-slate-500">
              Status
              <select
                value={filters.status}
                onChange={(event) => filter("status", event.target.value)}
                className={`${INPUT} mt-2`}
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS).map(([value, [label]]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-500">
              Priority
              <select
                value={filters.priority}
                onChange={(event) => filter("priority", event.target.value)}
                className={`${INPUT} mt-2`}
              >
                <option value="">All priorities</option>
                <option value="STANDARD">Standard</option>
                <option value="EXPRESS">Express</option>
                <option value="UNSET">Not set</option>
              </select>
            </label>

            <label className="text-sm text-slate-500">
              Rider assignment
              <select
                value={filters.assignment}
                onChange={(event) => filter("assignment", event.target.value)}
                className={`${INPUT} mt-2`}
              >
                <option value="">All parcels</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-orange-200 px-4 py-2.5
                text-sm font-semibold text-orange-600"
            >
              Clear all filters
            </button>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 flex justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <caption className="sr-only">All parcels across the delivery pipeline</caption>
              <thead>
                <tr className="border-b border-orange-100 text-xs uppercase text-gray-400">
                  {[
                    "Parcel ID",
                    "Sender / Receiver",
                    "Route",
                    "Weight",
                    "Priority",
                    "Rider",
                    "Status",
                    "Action",
                  ].map((label) => (
                    <th key={label} scope="col" className="px-5 pb-4 pt-8 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading || error || !data.parcels.length ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                      {loading
                        ? "Loading parcels..."
                        : error
                        ? "Unable to load parcels. Please retry."
                        : "No parcels match these filters."}
                    </td>
                  </tr>
                ) : (
                  data.parcels.map((parcel) => (
                    <tr
                      key={parcel.id}
                      className="border-b border-orange-100 last:border-b-0 hover:bg-[#fff9f2]"
                    >
                      <td className="px-5 py-6 font-semibold">
                        {parcel.trackingId.startsWith("#") ? "" : "#"}
                        {parcel.trackingId}
                      </td>

                      <td className="px-5 py-6">
                        <p className="max-w-[200px] break-words">{parcel.senderName}</p>
                        <p className="mt-1 max-w-[200px] break-words text-xs text-slate-400">
                          → {parcel.receiverName}
                        </p>
                      </td>

                      <td className="px-5 py-6">
                        <p className="max-w-[250px] break-words text-slate-600">
                          {parcel.pickupAddress}
                        </p>
                        <p className="mt-1 max-w-[250px] break-words text-xs text-slate-400">
                          → {parcel.deliveryAddress}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-6 text-slate-600">
                        {parcel.parcelWeight == null
                          ? "—"
                          : `${parcel.parcelWeight} kg`}
                      </td>

                      <td className="px-5 py-6">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                            parcel.priority === "EXPRESS"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {priorityLabel(parcel.priority)}
                        </span>
                      </td>

                      <td className="px-5 py-6 text-slate-600">
                        {parcel.rider?.name || "Unassigned"}
                      </td>

                      <td className="px-5 py-6">
                        <StatusBadge value={parcel.status} />
                      </td>

                      <td className="px-5 py-6">
                        <button
                          type="button"
                          onClick={() => setSelectedId(parcel.id)}
                          aria-label={`View parcel ${parcel.trackingId}`}
                          className="rounded-xl border border-orange-500
                            px-4 py-2 text-orange-600 hover:bg-orange-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && !error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <p>
              {data.total} parcels · Page {filters.page} of {data.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setFilters((previous) => ({
                  ...previous,
                  page: previous.page - 1,
                }))}
                className="rounded-xl border border-orange-200 bg-white
                  px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={filters.page >= data.totalPages}
                onClick={() => setFilters((previous) => ({
                  ...previous,
                  page: previous.page + 1,
                }))}
                className="rounded-xl border border-orange-200 bg-white
                  px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedId !== null && (
        <ParcelDetails
          key={selectedId}
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => setReload((value) => value + 1)}
        />
      )}
    </AdminLayout>
  );
}