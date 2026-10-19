import { useEffect, useRef, useState } from "react";
import {
  getAssignedDeliveries,
  updateDeliveryStatus,
} from "../../services/riderApi";

const NEXT = {
  CONFIRMED: {
    status: "PICKED_UP",
    label: "Mark Picked Up",
  },
  PICKED_UP: {
    status: "OUT_FOR_DELIVERY",
    label: "Start Delivery",
  },
  OUT_FOR_DELIVERY: {
    status: "DELIVERED",
    label: "Mark Delivered",
  },
};

const LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Assigned",
  PICKED_UP: "Picked Up",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

function badgeClass(status) {
  if (status === "DELIVERED") {
    return "bg-green-50 text-green-700";
  }

  if (["CANCELLED", "RETURNED"].includes(status)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-orange-50 text-orange-700";
}

export default function AssignedDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const busy = useRef(false);

  async function loadDeliveries() {
    if (busy.current) return;

    busy.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await getAssignedDeliveries();
      const data = response?.data ?? response;

      if (!Array.isArray(data)) {
        throw new Error("Unexpected delivery response");
      }

      setDeliveries(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load deliveries. Try Refresh."
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function changeStatus(item) {
    const action = NEXT[item.status];

    if (!action || busy.current) return;

    if (
      action.status === "DELIVERED" &&
      !window.confirm(
        `Confirm parcel ${item.trackingId} was handed to the recipient?`
      )
    ) {
      return;
    }

    busy.current = true;
    setSavingId(item.id);
    setError("");

    try {
      const updated = await updateDeliveryStatus(
        item.id,
        action.status,
        item.status
      );

      setDeliveries((previous) =>
        previous.map((delivery) =>
          delivery.id === item.id
            ? { ...delivery, ...updated }
            : delivery
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Update failed. Refresh before trying again."
      );
    } finally {
      busy.current = false;
      setSavingId(null);
    }
  }

  const visible = deliveries.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return Boolean(NEXT[item.status]);
    return item.status === filter;
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#4b2100]">
            Assigned Deliveries
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your assigned parcels.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDeliveries}
          disabled={loading || savingId !== null}
          className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm text-orange-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["ALL", "All"],
          ["ACTIVE", "Active"],
          ["DELIVERED", "Delivered"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === value
                ? "bg-[#4b2100] text-white"
                : "bg-white text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading && deliveries.length === 0 ? (
        <p className="rounded-2xl bg-white p-6">
          Loading deliveries...
        </p>
      ) : (
        <div className="space-y-5">
          {!error && visible.length === 0 && (
            <p className="rounded-2xl bg-white p-6 text-gray-500">
              No deliveries found.
            </p>
          )}

          {visible.map((item) => {
            const action = NEXT[item.status];

            const destination =
              item.status === "CONFIRMED" ||
              item.status === "PENDING"
                ? item.pickupAddress
                : item.deliveryAddress;

            const phone = String(
              item.receiverPhone || ""
            ).replace(/[^\d+]/g, "");

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
              >
                <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2 xl:grid-cols-6">
                  <div>
                    <h2 className="font-bold text-[#4b2100]">
                      #{item.trackingId}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {item.parcelType}
                      {item.parcelWeight != null
                        ? ` · ${item.parcelWeight} kg`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">
                      Pickup
                    </p>
                    <p className="break-words font-medium">
                      {item.pickupAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">
                      Drop-off
                    </p>
                    <p className="break-words font-medium">
                      {item.deliveryAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">
                      Recipient
                    </p>
                    <p className="font-medium">
                      {item.receiverName}
                    </p>

                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="text-sm text-orange-600"
                      >
                        {item.receiverPhone}
                      </a>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                        item.status
                      )}`}
                    >
                      {LABELS[item.status] || item.status}
                    </span>
                  </div>

                  <div>
                    {destination && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          destination
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full border border-orange-500 px-4 py-2 text-sm text-orange-600"
                      >
                        Navigate
                      </a>
                    )}
                  </div>
                </div>

                {action && (
                  <div className="mt-5 flex justify-end border-t border-orange-50 pt-4">
                    <button
                      type="button"
                      onClick={() => changeStatus(item)}
                      disabled={savingId !== null || loading}
                      className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {savingId === item.id
                        ? "Updating..."
                        : action.label}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}