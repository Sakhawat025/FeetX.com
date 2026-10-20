import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminRiders,
  createAdminRider,
  updateAdminRider,
} from "../../services/adminApi";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  vehicleName: "",
  plateNumber: "",
  vehicleId: "",
  zone: "",
  status: true,
};

const FORM_FIELDS = [
  ["name", "Full name", "text", 100],
  ["email", "Email address", "email", 254],
  ["phone", "Phone number", "tel", 25],
  ["vehicleName", "Vehicle name", "text", 100],
  ["plateNumber", "Plate number", "text", 40],
  ["vehicleId", "Vehicle ID", "text", 40],
  ["zone", "Location / zone", "text", 100],
];

const BADGES = {
  "On Delivery": "bg-orange-100 text-orange-600",
  Available: "bg-emerald-100 text-emerald-600",
  Offline: "bg-gray-100 text-gray-600",
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

function errorMessage(error) {
  return error.response?.data?.message || "Something went wrong. Try again.";
}

function RiderDialog({ rider, onClose, onSaved }) {
  const editing = Boolean(rider);
  const dialogRef = useRef(null);
  const submitting = useRef(false);

  const [form, setForm] = useState(() => {
    if (!rider) return { ...EMPTY_FORM };

    return Object.fromEntries(
      Object.keys(EMPTY_FORM).map((key) => [
        key,
        key === "password" ? "" : rider[key] ?? EMPTY_FORM[key],
      ])
    );
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  function change(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setError("");

    try {
      const payload = { ...form };

      if (editing && !payload.password) {
        delete payload.password;
      }

      if (editing) {
        await updateAdminRider(rider.id, payload);
      } else {
        await createAdminRider(payload);
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
      return;
    } finally {
      submitting.current = false;
      setSaving(false);
    }

    onSaved(
      editing ? "Rider updated successfully." : "Rider added successfully."
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rider-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting.current) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl
        overflow-y-auto rounded-3xl bg-white p-0 text-[#40200f]
        shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-orange-100 p-6">
        <div>
          <h2 id="rider-dialog-title" className="text-xl font-bold">
            {editing ? "Edit Rider" : "Add Rider"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Update rider and vehicle details."
              : "Create a rider account and assign vehicle details."}
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={onClose}
          aria-label="Close rider form"
          className="rounded-lg p-2 hover:bg-orange-50 disabled:opacity-50"
        >
          <X size={22} />
        </button>
      </div>

      <form onSubmit={submit} className="p-6">
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          {FORM_FIELDS.map(([name, label, type, maxLength]) => (
            <label key={name} className="block text-sm font-medium">
              {label}
              {["name", "email"].includes(name) && (
                <span className="ml-1 text-orange-600">*</span>
              )}

              <input
                autoFocus={name === "name"}
                name={name}
                type={type}
                value={form[name]}
                onChange={change}
                required={["name", "email"].includes(name)}
                maxLength={maxLength}
                className="mt-2 w-full rounded-xl border border-orange-200
                  bg-white px-3 py-3 text-slate-700 outline-none
                  focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          ))}

          <label className="block text-sm font-medium">
            {editing ? "New password (optional)" : "Password *"}

            <input
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={change}
              required={!editing}
              minLength={8}
              maxLength={72}
              placeholder={
                editing ? "Leave blank to keep password" : "Minimum 8 characters"
              }
              className="mt-2 w-full rounded-xl border border-orange-200
                px-3 py-3 outline-none focus:border-orange-500
                focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-orange-50 p-4 sm:col-span-2">
            <input
              name="status"
              type="checkbox"
              checked={form.status}
              onChange={change}
              className="h-4 w-4 accent-orange-600"
            />
            <span className="text-sm">
              Account enabled / available for assignments
            </span>
          </label>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-orange-200 px-5 py-3
              text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#40200f] px-5 py-3 text-sm
              font-semibold text-white hover:bg-[#60351e] disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Rider"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function AdminRiders() {
  const { user, logout } = useAuth();

  const [riders, setRiders] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminRiders();
        if (!cancelled) setRiders(data);
      } catch (requestError) {
        if (!cancelled) setError(errorMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const search = query.trim().toLowerCase();

  const filtered = riders.filter((rider) =>
    [rider.name, rider.riderCode].some((value) =>
      value.toLowerCase().includes(search)
    )
  );

  function saved(message) {
    setDialog(null);
    setNotice(message);
    setReload((value) => value + 1);
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
            <p className="text-base text-slate-500">Fleet Management</p>

            <h1 className="mt-1 text-3xl font-bold">
              Riders <span className="ml-1">👋</span>
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Manage rider profiles, availability and performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#40200f] font-bold text-white">
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

        <div className="my-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-[400px]">
            <Search
              size={19}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              aria-label="Search riders by name or ID"
              placeholder="Search riders by name or ID..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-[20px] border border-orange-100
                bg-white py-3.5 pl-11 pr-4 text-sm text-slate-700
                outline-none placeholder:text-slate-400
                focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setNotice("");
              setDialog({ rider: null });
            }}
            className="inline-flex items-center justify-center gap-2
              rounded-[20px] bg-[#40200f] px-5 py-3.5 text-sm
              font-semibold text-white hover:bg-[#60351e]"
          >
            <Plus size={20} />
            Add Rider
          </button>
        </div>

        {notice && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
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
            <table className="w-full min-w-[960px] text-left text-sm">
              <caption className="sr-only">
                Riders, assigned vehicles, service zones and performance
              </caption>

              <thead>
                <tr className="border-b border-orange-100 text-xs uppercase text-gray-400">
                  {[
                    "Rider",
                    "Vehicle",
                    "Location",
                    "Workload",
                    "Rating",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      scope="col"
                      key={heading}
                      className="px-5 pb-4 pt-8 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      Loading riders...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      Unable to load riders. Please retry.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      {search
                        ? "No riders match your search."
                        : "No riders yet. Click Add Rider to create one."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((rider) => (
                    <tr
                      key={rider.id}
                      className="border-b border-orange-100 last:border-b-0 hover:bg-[#fff9f2]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#40200f] text-sm font-semibold text-white">
                            {initials(rider.name)}
                          </div>

                          <div>
                            <p className="max-w-[220px] break-words font-semibold">
                              {rider.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {rider.riderCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-slate-600">
                        {rider.vehicleName || "Not assigned"}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin
                            size={16}
                            className="shrink-0 text-orange-500"
                          />
                          {rider.zone || "Not set"}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-slate-600">
                        {rider.workload} active
                      </td>

                      <td className="px-5 py-5">
                        {rider.rating == null ? (
                          <span className="text-xs text-slate-400">
                            No reviews
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Star
                              size={16}
                              className="fill-orange-500 text-orange-500"
                            />
                            {Number(rider.rating).toFixed(1)}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                            BADGES[rider.availability]
                          }`}
                        >
                          {rider.availability}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <button
                          type="button"
                          onClick={() => {
                            setNotice("");
                            setDialog({ rider });
                          }}
                          aria-label={`Edit ${rider.name}`}
                          className="rounded-xl border border-orange-500 px-4 py-2
                            text-sm font-medium text-orange-600 hover:bg-orange-50"
                        >
                          Edit
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
          <p className="mt-4 text-xs text-slate-500">
            Showing {filtered.length} of {riders.length} riders
          </p>
        )}
      </section>

      {dialog && (
        <RiderDialog
          rider={dialog.rider}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}
    </AdminLayout>
  );
}