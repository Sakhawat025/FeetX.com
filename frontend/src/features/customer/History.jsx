import { useEffect, useState } from "react";
import { Eye, History as HistoryIcon } from "lucide-react";
import { getMyDeliveries } from "../../services/deliveryApi";
import { useNavigate } from "react-router-dom";

function History() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
   const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getMyDeliveries();
        setDeliveries(data || []);
      } catch (error) {
        console.error("Failed to load delivery history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filteredDeliveries =
    activeFilter === "ALL"
      ? deliveries
      : deliveries.filter((delivery) => delivery.status === activeFilter);

  const getStatusClass = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-50 text-green-600";
      case "CANCELLED":
        return "bg-red-50 text-red-600";
      case "RETURNED":
        return "bg-purple-50 text-purple-600";
      default:
        return "bg-orange-50 text-orange-600";
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] flex">
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900">Delivery History</h1>
        <p className="mt-2 text-gray-500">View your delivery history.</p>
        {/* Filters */}
        <div className="mt-6 flex gap-3">
          {[
            { label: "All", value: "ALL" },
            { label: "Delivered", value: "DELIVERED" },
            { label: "Cancelled", value: "CANCELLED" },
            { label: "Returned", value: "RETURNED" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${
                activeFilter === filter.value
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {/* History Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#fffaf3]">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">Tracking ID</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">Sender</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">Receiver</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">From</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">To</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-gray-500">
                      Loading delivery history...
                    </td>
                  </tr>
                ) : filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-12 text-center">
                      <HistoryIcon className="mx-auto mb-3 text-gray-300" size={32} />
                      <p className="font-medium text-gray-600">No delivery history found</p>
                      <p className="mt-1 text-sm text-gray-400">Your completed deliveries will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-[#fffaf3]">
                      <td className="px-5 py-5 text-sm font-semibold text-gray-900">{delivery.trackingId}</td>
                      <td className="px-5 py-5 text-sm text-gray-600">{delivery.senderName}</td>
                      <td className="px-5 py-5 text-sm text-gray-600">{delivery.receiverName}</td>
                      <td className="px-5 py-5 text-sm text-gray-600">{delivery.pickupAddress}</td>
                      <td className="px-5 py-5 text-sm text-gray-600">{delivery.deliveryAddress}</td>
                      <td className="px-5 py-5 text-sm text-gray-600">
                        {new Date(delivery.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-5">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <button
                            onClick={() =>
                              navigate(`/customer/tracking?trackingId=${delivery.trackingId}`)
                            }
                          >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredDeliveries.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
              Showing {filteredDeliveries.length} of {deliveries.length} deliveries
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default History;
