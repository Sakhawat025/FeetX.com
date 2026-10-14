import { useEffect, useState } from "react";
import { getLiveRiders } from "../../../services/adminApi";

function LiveRiders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRiders = async () => {
      try {
        const data = await getLiveRiders();
        setRiders(data);
      } catch (error) {
        console.error("Failed to load riders:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRiders();
  }, []);

  const getStatus = (status) => {
    if (status) {
      return { text: "Available", className: "text-green-600" };
    }
    return { text: "Offline", className: "text-gray-400" };
  };

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm h-[520px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Live Riders</h2>
        <span className="text-xs text-green-600">{riders.length} riders</span>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-sm text-gray-500">Loading riders...</p>
        ) : riders.length === 0 ? (
          <p className="py-6 text-sm text-gray-500">No riders found.</p>
        ) : (
          <div className="divide-y divide-orange-100 max-h-[420px] overflow-y-auto pr-2">
            {riders.map((rider) => {
              const status = getStatus(rider.status);
              const initials = rider.name
                ? rider.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()
                : "R";

              return (
                <div key={rider.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4b2100] text-xs font-semibold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{rider.name}</p>
                      <p className="text-xs text-gray-400">{rider.phone || "No phone"}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${status.className}`}>{status.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveRiders;
