import { useEffect, useMemo, useState } from "react";
import { Eye, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyDeliveries } from "../../services/deliveryApi";

export default function History() {
  const [deliveries, setDeliveries] = useState([]);
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMyDeliveries();
        setDeliveries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load delivery history:", err);
        setError("Failed to load delivery history.");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const tabs = ["All", "Delivered", "Cancelled", "Returned"];

  const filteredDeliveries = useMemo(() => {
    if (tab === "All") return deliveries;
    return deliveries.filter(
      (delivery) => delivery.status?.toLowerCase() === tab.toLowerCase()
    );
  }, [deliveries, tab]);

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "bg-green-50 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      case "RETURNED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <h2 className="section-title">Delivery History</h2>
      <p className="mt-2 text-gray-500">View your delivery history.</p>
      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === item
                ? "bg-fleet-600 text-white"
                : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {/* Loading */}
      {loading && (
        <div className="panel mt-5 p-8 text-center text-gray-500">
          Loading delivery history...
        </div>
      )}
      {/* Error */}
      {!loading && error && (
        <div className="panel mt-5 p-8 text-center text-red-600">{error}</div>
      )}
      {/* Empty */}
      {!loading && !error && filteredDeliveries.length === 0 && (
        <div className="panel mt-5 p-10 text-center">
          <Package size={42} className="mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800">
            No delivery history found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Your completed or previous deliveries will appear here.
          </p>
        </div>
      )}
      {/* History Table */}
      {!loading && !error && filteredDeliveries.length > 0 && (
        <div className="panel mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-5 py-4 text-gray-600">Tracking ID</th>
                  <th className="px-5 py-4 text-gray-600">Sender</th>
                  <th className="px-5 py-4 text-gray-600">Receiver</th>
                  <th className="px-5 py-4 text-gray-600">From</th>
                  <th className="px-5 py-4 text-gray-600">To</th>
                  <th className="px-5 py-4 text-gray-600">Date</th>
                  <th className="px-5 py-4 text-gray-600">Status</th>
                  <th className="px-5 py-4 text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-t border-gray-100">
                    <td className="px-5 py-4 font-bold">{delivery.trackingId}</td>
                    <td className="px-5 py-4">{delivery.senderName || "-"}</td>
                    <td className="px-5 py-4">{delivery.receiverName || "-"}</td>
                    <td className="px-5 py-4">{delivery.pickupAddress || "-"}</td>
                    <td className="px-5 py-4">{delivery.deliveryAddress || "-"}</td>
                    <td className="px-5 py-4">{formatDate(delivery.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          delivery.status
                        )}`}
                      >
                        {formatStatus(delivery.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          navigate(`/customer/tracking?trackingId=${delivery.trackingId}`)
                        }
                        className="flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-2 text-fleet-700 hover:bg-orange-50"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
            Showing {filteredDeliveries.length} of {deliveries.length} deliveries
          </div>
        </div>
      )}
    </div>
  );
}
