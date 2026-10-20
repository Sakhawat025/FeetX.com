import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Fuel, Pencil, Plus, X } from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { getVehicles, saveVehicle } from "../../services/vehicleApi";

const STATUS = {
  ACTIVE: {
    label: "Active",
    style: "bg-emerald-100 text-emerald-600",
  },
  IDLE: {
    label: "Idle",
    style: "bg-gray-100 text-gray-600",
  },
  MAINTENANCE: {
    label: "In Maintenance",
    style: "bg-red-100 text-red-600",
  },
};

const INPUT =
  "mt-2 w-full rounded-xl border border-orange-200 bg-white " +
  "px-3 py-3 text-sm text-slate-700 outline-none " +
  "focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

function message(error) {
  return error.response?.data?.message || "Request failed. Please try again.";
}

function code(id) {
  return `VEH-${String(id).padStart(3, "0")}`;
}

function serviceDate(value) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function VehicleForm({ vehicle, riders, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const busyRef = useRef(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: vehicle?.name || "",
    plateNumber: vehicle?.plateNumber || "",
    type: vehicle?.type || "Motorbike",
    capacityKg: vehicle?.capacityKg ?? "",
    fuelPercent: vehicle?.fuelPercent ?? "",
    lastServicedAt: vehicle?.lastServicedAt?.slice(0, 10) || "",
    status: vehicle?.status || "IDLE",
    riderId: vehicle?.riderId ?? "",
  });

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
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();

    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      await saveVehicle(vehicle?.id, {
        ...form,
        capacityKg: Number(form.capacityKg),
        fuelPercent:
          form.fuelPercent === "" ? null : Number(form.fuelPercent),
        riderId: form.riderId === "" ? null : Number(form.riderId),
        lastServicedAt: form.lastServicedAt || null,
      });
    } catch (requestError) {
      setError(message(requestError));
      return;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }

    onSaved(vehicle ? "Vehicle updated." : "Vehicle added.");
  }

  const availableRiders = riders.filter((rider) => {
    if (rider.id === vehicle?.riderId) return true;

    return (
      rider.status &&
      (!rider.assignedVehicle ||
        rider.assignedVehicle.id === vehicle?.id)
    );
  });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="vehicle-form-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busyRef.current) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl
        overflow-y-auto rounded-3xl bg-white p-0 text-[#40200f]
        shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-orange-100 p-6">
        <h2 id="vehicle-form-title" className="text-xl font-bold">
          {vehicle ? "Edit Vehicle" : "Add Vehicle"}
        </h2>

        <button
          type="button"
          aria-label="Close vehicle form"
          disabled={busy}
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-orange-50 disabled:opacity-50"
        >
          <X size={22} />
        </button>
      </div>

      <form onSubmit={submit} className="p-6">
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Vehicle name *
            <input
              autoFocus
              required
              name="name"
              value={form.name}
              onChange={change}
              maxLength={100}
              placeholder="Honda CB Shine"
              className={INPUT}
            />
          </label>

          <label className="text-sm font-medium">
            Plate number *
            <input
              required
              name="plateNumber"
              value={form.plateNumber}
              onChange={change}
              maxLength={40}
              placeholder="DHK-14-3312"
              className={INPUT}
            />
          </label>

          <label className="text-sm font-medium">
            Vehicle type *
            <select
              name="type"
              value={form.type}
              onChange={change}
              className={INPUT}
            >
              {["Motorbike", "Van", "Truck", "Car", "Bicycle"].map(
                (type) => <option key={type}>{type}</option>
              )}
            </select>
          </label>

          <label className="text-sm font-medium">
            Assigned rider
            <select
              name="riderId"
              value={form.riderId}
              onChange={change}
              className={INPUT}
            >
              <option value="">Unassigned</option>
              {availableRiders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name} — RDR-{String(rider.id).padStart(3, "0")}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Capacity (kg) *
            <input
              required
              type="number"
              name="capacityKg"
              value={form.capacityKg}
              onChange={change}
              min="0.01"
              max="100000"
              step="0.01"
              className={INPUT}
            />
          </label>

          <label className="text-sm font-medium">
            Fuel (%)
            <input
              type="number"
              name="fuelPercent"
              value={form.fuelPercent}
              onChange={change}
              min="0"
              max="100"
              step="1"
              placeholder="Leave blank if unknown"
              className={INPUT}
            />
          </label>

          <label className="text-sm font-medium">
            Last serviced
            <input
              type="date"
              name="lastServicedAt"
              value={form.lastServicedAt}
              onChange={change}
              className={INPUT}
            />
          </label>

          <label className="text-sm font-medium">
            Status
            <select
              name="status"
              value={form.status}
              onChange={change}
              className={INPUT}
            >
              {Object.entries(STATUS).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-orange-200 px-5 py-3
              text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#40200f] px-5 py-3 text-sm
              font-semibold text-white hover:bg-[#60351e] disabled:opacity-50"
          >
            {busy ? "Saving..." : vehicle ? "Save Changes" : "Add Vehicle"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function AdminVehicles() {
  const { user, logout } = useAuth();

  const [data, setData] = useState({ vehicles: [], riders: [] });
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
        const result = await getVehicles();
        if (!cancelled) setData(result);
      } catch (requestError) {
        if (!cancelled) setError(message(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  function open(vehicle = null) {
    setNotice("");
    setDialog({ vehicle });
  }

  function saved(text) {
    setDialog(null);
    setNotice(text);
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

            <h1 className="mt-1 text-3xl font-bold">Vehicles 👋</h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Track vehicle status, assignments and maintenance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#40200f] font-bold text-white">
              {(user?.name || "A").charAt(0).toUpperCase()}
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

        <div className="my-7 flex justify-end">
          <button
            type="button"
            disabled={loading || Boolean(error)}
            onClick={() => open()}
            className="inline-flex items-center gap-2 rounded-[20px]
              bg-[#40200f] px-5 py-3.5 text-sm font-semibold text-white
              hover:bg-[#60351e] disabled:opacity-50"
          >
            <Plus size={20} />
            Add Vehicle
          </button>
        </div>

        {notice && (
          <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        {error && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
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
            <table className="w-full min-w-[1080px] text-left text-sm">
              <caption className="sr-only">
                Vehicles, rider assignments, fuel and service status
              </caption>

              <thead>
                <tr className="border-b border-orange-100 text-xs uppercase text-gray-400">
                  {[
                    "Vehicle",
                    "Type",
                    "Assigned Rider",
                    "Capacity",
                    "Fuel",
                    "Last Serviced",
                    "Status",
                    "Edit",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-5 pb-4 pt-8 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading || error || data.vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                      {loading
                        ? "Loading vehicles..."
                        : error
                          ? "Unable to load vehicles. Please retry."
                          : "No vehicles yet. Click Add Vehicle to create one."}
                    </td>
                  </tr>
                ) : (
                  data.vehicles.map((vehicle) => {
                    const badge = STATUS[vehicle.status];
                    const fuel = vehicle.fuelPercent;

                    const fuelColor =
                      fuel < 20
                        ? "bg-red-500"
                        : fuel < 50
                          ? "bg-orange-500"
                          : "bg-green-600";

                    return (
                      <tr
                        key={vehicle.id}
                        className="border-b border-orange-100 last:border-b-0 hover:bg-[#fff9f2]"
                      >
                        <td className="px-5 py-5">
                          <p className="font-semibold">{vehicle.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {code(vehicle.id)} · {vehicle.plateNumber}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-slate-600">
                          {vehicle.type}
                        </td>

                        <td className="px-5 py-5 text-slate-600">
                          {vehicle.rider?.name || "Unassigned"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-slate-600">
                          {vehicle.capacityKg} kg
                        </td>

                        <td className="px-5 py-5">
                          {fuel == null ? (
                            <span className="text-xs text-slate-400">
                              Not recorded
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Fuel size={17} className="text-slate-400" />
                              <div
                                role="progressbar"
                                aria-label={`${vehicle.name} fuel`}
                                aria-valuenow={fuel}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="h-1.5 w-[70px] overflow-hidden rounded-full bg-gray-100"
                              >
                                <div
                                  className={`h-full rounded-full ${fuelColor}`}
                                  style={{ width: `${fuel}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">
                                {fuel}%
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-slate-600">
                          {serviceDate(vehicle.lastServicedAt)}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full
                              px-3 py-1.5 text-xs font-semibold ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <button
                            type="button"
                            aria-label={`Edit ${vehicle.name}`}
                            onClick={() => open(vehicle)}
                            className="rounded-lg border border-orange-200 p-2
                              text-orange-600 hover:bg-orange-50"
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {dialog && (
        <VehicleForm
          vehicle={dialog.vehicle}
          riders={data.riders}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}
    </AdminLayout>
  );
}