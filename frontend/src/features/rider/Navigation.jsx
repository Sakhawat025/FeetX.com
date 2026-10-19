import { useEffect, useState } from "react";
import { getAssignedDeliveries } from "../../services/riderApi";
import DeliveryRouteMap from "../../components/common/DeliveryRouteMap";

const ACTIVE = [
  "CONFIRMED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
];

export default function Navigation() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer;

    async function load() {
      try {
        const response = await getAssignedDeliveries();
        const list = response?.data ?? response;

        if (!Array.isArray(list)) {
          throw new Error("Invalid delivery list");
        }

        const activeDeliveries = list.filter((delivery) =>
          ACTIVE.includes(delivery.status)
        );

        if (active) {
          setDeliveries(activeDeliveries);
          setError("");

          setSelectedId((previous) => {
            const stillAssigned = activeDeliveries.some(
              (delivery) => String(delivery.id) === previous
            );

            return stillAssigned
              ? previous
              : activeDeliveries[0]
                ? String(activeDeliveries[0].id)
                : "";
          });
        }
      } catch (err) {
        if (active) {
          setDeliveries([]);
          setSelectedId("");
          setError(
            err.response?.data?.message ||
              "Unable to load assigned deliveries."
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
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Delivery Navigation
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Select a parcel and start location sharing to see
          the route from your current position.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p>Loading deliveries...</p>
      ) : deliveries.length === 0 ? (
        <p>No active assigned deliveries.</p>
      ) : (
        <>
          <div>
            <label
              htmlFor="navigation-delivery"
              className="mb-2 block text-sm font-medium"
            >
              Select delivery
            </label>

            <select
              id="navigation-delivery"
              value={selectedId}
              onChange={(event) =>
                setSelectedId(event.target.value)
              }
              className="w-full rounded-xl border bg-white p-3"
            >
              {deliveries.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {delivery.trackingId}
                  {" — "}
                  {delivery.receiverName}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <DeliveryRouteMap
              key={selectedId}
              deliveryId={selectedId}
            />
          </div>
        </>
      )}
    </div>
  );
}