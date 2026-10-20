import { useState } from "react";
import { MapPin, Navigation, Truck } from "lucide-react";
import AdminLayout from "../../features/admin/components/AdminLayout";
import LiveLocationMap from "../../components/common/LiveLocationMap";
import { useAuth } from "../../context/AuthContext";

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function statusColor(rider) {
  if (!rider.enabled) return "bg-gray-400";
  if (rider.activeParcels > 0) return "bg-orange-500";
  return "bg-green-600";
}

function Avatar({ name, large = false }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#42200e] font-bold text-white ${
        large ? "h-12 w-12" : "h-10 w-10"
      }`}
    >
      {initials(name)}
    </div>
  );
}

function DetailRow({ title, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-slate-400">{title}</dt>
      <dd className="text-right text-sm font-medium text-[#42200e]">{children}</dd>
    </div>
  );
}

export default function AdminFleetMap() {
  const { user } = useAuth();
  const [fleetData, setFleetData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fleet = fleetData?.fleet || [];
  const selected = fleet.find((rider) => rider.id === selectedId) || fleet[0] || null;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#fff4e8] p-4 sm:p-6 xl:p-8">
        {/* Page header */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Operations</p>
            <h1 className="mt-1 text-2xl font-bold text-[#42200e]">Live Fleet Map 👋</h1>
            <p className="mt-2 text-sm text-slate-500">Real-time visibility of rider locations and active deliveries.</p>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Avatar name={user?.name || "Admin"} />
            <div>
              <p className="text-sm font-semibold text-[#42200e]">{user?.name || "Admin"}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main map */}
          <section className="min-w-0 rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <LiveLocationMap
              endpoint="/tracking/fleet-overview"
              onData={setFleetData}
              selectedRiderId={selected?.id ?? null}
              onSelectRider={setSelectedId}
              showRiderList={false}
              height={620}
            />
          </section>

          {/* Right sidebar */}
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 pb-3 pt-5">
                <h2 className="font-semibold text-[#42200e]">Fleet ({fleet.length})</h2>
                <span className="text-xs text-slate-400">{fleetData?.riders?.length || 0} live GPS</span>
              </div>

              <div className="max-h-[340px] overflow-y-auto px-3 pb-3">
                {!fleetData && <p className="px-2 py-6 text-sm text-slate-400">Waiting for fleet data…</p>}
                {fleetData && fleet.length === 0 && <p className="px-2 py-6 text-sm text-slate-400">No riders found.</p>}

                {fleet.map((rider) => (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => setSelectedId(rider.id)}
                    aria-pressed={selected?.id === rider.id}
                    className={`flex w-full items-center gap-3 rounded-xl border-b border-orange-50 px-2 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-orange-500 ${
                      selected?.id === rider.id ? "bg-orange-50" : "hover:bg-orange-50/60"
                    }`}
                  >
                    <Avatar name={rider.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#42200e]">{rider.name}</p>
                      <p className="truncate text-xs text-slate-400">{rider.zone || "Area not set"}</p>
                    </div>
                    <span title={rider.status} aria-label={rider.status} className={`h-2 w-2 shrink-0 rounded-full ${statusColor(rider)}`} />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#42200e]">Selected Rider</h2>

              {!selected ? (
                <p className="text-sm text-slate-400">Select a rider to view details.</p>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar name={selected.name} large />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#42200e]">{selected.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        ★ {selected.rating == null ? "Not rated" : Number(selected.rating).toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <dl>
                    <DetailRow title="Status">{selected.status}</DetailRow>
                    <DetailRow title="Area">{selected.zone || "Not set"}</DetailRow>
                    <DetailRow title="Vehicle">{selected.vehicleName || "Not set"}</DetailRow>
                    <DetailRow title="Plate">{selected.plateNumber || "Not set"}</DetailRow>
                    <DetailRow title="Active Parcels">{selected.activeParcels}</DetailRow>
                    <DetailRow title="Completed Today">{selected.completedToday}</DetailRow>
                    <DetailRow title="GPS">{selected.location ? "Recent location" : "Not sharing / unavailable"}</DetailRow>
                  </dl>

                  {selected.location && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <MapPin size={14} />
                      Updated {new Date(selected.location.capturedAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka" })}
                    </p>
                  )}

                  {!selected.location && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <Navigation size={14} />
                      No live telemetry stream available.
                    </p>
                  )}
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
