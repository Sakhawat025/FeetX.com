import { useEffect, useState } from "react";
import { getAssignedDeliveries } from "../../services/riderApi";
function AssignedDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const data = await getAssignedDeliveries();
        setDeliveries(data || []);
      } catch (error) {
        console.error("Failed to load deliveries:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#4b2100]">
          Assigned Deliveries
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Your assigned deliveries for today.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-6">
          Loading deliveries...
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-6">
          <p className="text-gray-500">
            No assigned deliveries found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5"
            >
              {/* Top */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    #{item.trackingId}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.packageType || "Package"}
                    {" • "}
                    {item.weight || "0"} kg
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "DELIVERED"
                      ? "bg-green-50 text-green-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {item.status || "Assigned"}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5 text-sm">
                <div>
                  <p className="text-gray-400">Pickup</p>
                  <p className="font-medium">{item.pickupAddress || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-400">Drop-off</p>
                  <p className="font-medium">{item.deliveryAddress || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-400">Customer</p>
                  <p className="font-medium">{item.customerName || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-400">Distance</p>
                  <p className="font-medium">{item.distance || "-"}</p>
                </div>
              </div>

              {/* Button */}
              <button className="mt-5 px-5 py-2 rounded-xl border border-orange-500 text-orange-600 text-sm font-medium hover:bg-orange-50">
                Navigate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AssignedDeliveries;
