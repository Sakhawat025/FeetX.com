import { useEffect, useRef, useState } from "react";
import {
  getPendingAssignments,
  getLiveRiders,
  assignDeliveryRider,
} from "../../../services/adminApi";

function asArray(response) {
  const data = response?.data ?? response;

  if (!Array.isArray(data)) {
    throw new Error("Unexpected server response");
  }

  return data;
}

export default function PendingAssignment({ onAssigned }) {
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const busy = useRef(false);

  async function loadData() {
    if (busy.current) return;

    busy.current = true;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [deliveryData, riderData] = await Promise.all([
        getPendingAssignments(),
        getLiveRiders(),
      ]);

      setDeliveries(asArray(deliveryData));
      setRiders(
        asArray(riderData).filter(
          (rider) => rider.status === true
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load assignments and riders."
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assign(item) {
    const riderId = selected[item.id];

    if (!riderId || busy.current) return;

    busy.current = true;
    setSavingId(item.id);
    setError("");
    setSuccess("");

    try {
      await assignDeliveryRider(item.id, riderId);

      setDeliveries((previous) =>
        previous.filter((delivery) => delivery.id !== item.id)
      );

      setSuccess(`#${item.trackingId} assigned successfully.`);
      onAssigned?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Assignment failed. Refresh before trying again."
      );
    } finally {
      busy.current = false;
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-gray-900">
          Pending Assignment
        </h2>

        <button
          type="button"
          onClick={loadData}
          disabled={loading || savingId !== null}
          className="text-sm text-orange-700 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {success}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-gray-500">
          Loading...
        </p>
      ) : (
        <div className="mt-5 max-h-[520px] space-y-4 overflow-y-auto">
          {!error && deliveries.length === 0 && (
            <p className="text-sm text-gray-500">
              No deliveries waiting for assignment.
            </p>
          )}

          {deliveries.length > 0 && riders.length === 0 && (
            <p className="text-sm text-orange-700">
              No active riders available.
            </p>
          )}

          {deliveries.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-orange-100 p-4"
            >
              <h3 className="font-semibold">
                #{item.trackingId}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Pickup: {item.pickupAddress}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Drop-off: {item.deliveryAddress}
              </p>

              <label
                htmlFor={`rider-${item.id}`}
                className="mt-4 block text-sm font-medium"
              >
                Select rider
              </label>

              <select
                id={`rider-${item.id}`}
                value={selected[item.id] || ""}
                onChange={(event) =>
                  setSelected((previous) => ({
                    ...previous,
                    [item.id]: event.target.value,
                  }))
                }
                disabled={savingId !== null}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 text-sm"
              >
                <option value="">Choose a rider</option>

                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}
                    {rider.phone ? ` — ${rider.phone}` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => assign(item)}
                disabled={
                  !selected[item.id] ||
                  savingId !== null ||
                  riders.length === 0
                }
                className="mt-3 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingId === item.id
                  ? "Assigning..."
                  : "Assign Rider"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}