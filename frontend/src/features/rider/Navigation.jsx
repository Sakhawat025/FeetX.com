import { useEffect, useRef, useState } from "react";
import {
  getAssignedDeliveries,
  updateDeliveryStatus,
} from "../../services/riderApi";
import DeliveryRouteMap from "../../components/common/DeliveryRouteMap";

const ACTIVE = ["CONFIRMED", "PICKED_UP", "OUT_FOR_DELIVERY"];

const STEPS = [
  ["CONFIRMED", "Assigned"],
  ["PICKED_UP", "Picked Up"],
  ["OUT_FOR_DELIVERY", "On The Way"],
  ["DELIVERED", "Delivered"],
];

export default function Navigation() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());

  const alive = useRef(false);
  const version = useRef(0);
  const updating = useRef(false);

  async function load() {
    const requestVersion = ++version.current;

    try {
      const response = await getAssignedDeliveries();
      const list = Array.isArray(response) ? response : response?.data;

      if (!Array.isArray(list)) throw new Error("Invalid delivery response.");

      if (!alive.current || requestVersion !== version.current) return;

      const active = list.filter((item) => ACTIVE.includes(item.status));
      setDeliveries(active);

      setSelectedId((previous) =>
        active.some((item) => String(item.id) === previous)
          ? previous
          : active[0]
          ? String(active[0].id)
          : ""
      );

      setError("");
    } catch (err) {
      if (alive.current && requestVersion === version.current) {
        setError(
          err.response?.data?.message || "Could not refresh deliveries."
        );
      }
    } finally {
      if (alive.current && requestVersion === version.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    alive.current = true;
    load();

    const refresh = window.setInterval(() => {
      if (!updating.current) load();
    }, 30000);

    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      alive.current = false;
      version.current += 1;
      window.clearInterval(refresh);
      window.clearInterval(clock);
    };
  }, []);

  const selected = deliveries.find(
    (item) => String(item.id) === selectedId
  );

  const current =
    String(journey?.delivery?.id) === selectedId &&
    journey?.delivery?.status === selected?.status
      ? journey
      : null;

  const age = current?.rider
    ? now - new Date(current.rider.capturedAt).getTime()
    : Infinity;

  const hasLiveRoute = Boolean(
    current?.route &&
      ["pickup", "delivery"].includes(current.mode) &&
      age >= -10000 &&
      age <= 120000
  );

  const goingToPickup = selected?.status === "CONFIRMED";
  const address = goingToPickup
    ? selected?.pickupAddress
    : selected?.deliveryAddress;

  const point = goingToPickup ? current?.pickup : current?.destination;

  const destination =
    Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude)
      ? `${point.latitude},${point.longitude}`
      : address;

  const mapsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}&travelmode=driving&dir_action=navigate`
    : null;

  const phone = selected?.receiverPhone?.replace(/[^\d+]/g, "");
  const callablePhone =
    phone && /^\+?\d{7,15}$/.test(phone) ? phone : null;

  async function changeStatus(nextStatus) {
    if (!selected || updating.current) return;

    if (
      nextStatus === "DELIVERED" &&
      !window.confirm("Confirm that the parcel was handed to the recipient?")
    )
      return;

    updating.current = true;
    version.current += 1;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await updateDeliveryStatus(
        selected.id,
        nextStatus,
        selected.status
      );

      if (!alive.current) return;

      setDeliveries((previous) =>
        previous.map((item) =>
          item.id === selected.id ? { ...item, ...result } : item
        )
      );
      setJourney(null);
      setNotice(
        nextStatus === "DELIVERED"
          ? "Delivery completed successfully."
          : "Delivery status updated."
      );

      await load();
    } catch (err) {
      await load();

      if (alive.current) {
        setError(
          err.response?.data?.message ||
            "Update could not be confirmed. Check the refreshed status."
        );
      }
    } finally {
      updating.current = false;
      if (alive.current) setBusy(false);
    }
  }

  const currentStep = STEPS.findIndex(
    ([status]) => status === selected?.status
  );

  return (
    <div className="space-y-5 text-[#42210f]">
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p>Loading deliveries...</p>
      ) : !selected ? (
        <div className="rounded-3xl bg-white p-8">
          <p>No active assigned deliveries.</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 text-orange-600"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium">
            Select Delivery
            <select
              value={selectedId}
              disabled={busy}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setJourney(null);
                setNotice("");
              }}
              className="mt-2 block w-full rounded-xl border border-orange-200 bg-white p-3"
            >
              {deliveries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.trackingId} — {item.receiverName}
                </option>
              ))}
            </select>
          </label>

          <div className="grid items-start gap-6 xl:grid-cols-3">
            <section className="min-w-0 rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
              <DeliveryRouteMap
                key={`${selected.id}-${selected.status}`}
                deliveryId={selected.id}
                onJourney={setJourney}
              />
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Next Destination</h2>
                <p className="mt-2 text-sm text-orange-600">
                  {goingToPickup ? "Pickup location" : "Delivery location"}
                </p>
                <p className="mt-2 text-gray-500">{address}</p>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">Distance</dt>
                    <dd>
                      {hasLiveRoute
                        ? `${(current.route.distanceMeters / 1000).toFixed(
                            1
                          )} km`
                        : "Unavailable"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">Estimated driving time</dt>
                    <dd>
                      {hasLiveRoute
                        ? `${Math.max(
                            1,
                            Math.round(current.route.durationSeconds / 60)
                          )} min`
                        : "Unavailable"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">Customer</dt>
                    <dd>{selected.customer?.name || "—"}</dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400">Recipient</dt>
                    <dd>{selected.receiverName}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-2xl bg-[#42210f] px-4 py-3 text-center font-semibold text-white"
                    >
                      Start Navigation
                    </a>
                  )}

                  {callablePhone ? (
                    <a
                      href={`tel:${callablePhone}`}
                      className="rounded-2xl border border-orange-500 px-4 py-3 text-orange-600"
                    >
                      Call Recipient
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Recipient phone unavailable
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Navigation opens Google Maps. Enable Start Sharing above
                  for live tracking. Driving estimates exclude live traffic.
                </p>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold">
                  Delivery Status Update
                </h2>

                <div className="space-y-3">
                  {STEPS.map(([status, label], index) => {
                    const completed = index <= currentStep;
                    const isNext = index === currentStep + 1;

                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={!isNext || busy}
                        onClick={() => changeStatus(status)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left font-medium ${
                          completed
                            ? "border-green-600 bg-green-50 text-green-700"
                            : isNext
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-orange-100 text-gray-400"
                        }`}
                      >
                        {completed ? "✓ " : ""}
                        {busy && isNext ? "Updating..." : label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}