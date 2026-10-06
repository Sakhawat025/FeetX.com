import {
  Box,
  CheckCircle2,
  Clock3,
  CalendarClock,
  Eye,
} from "lucide-react";
import CustomerHeader from "./components/CustomerHeader";
import StatCard from "./components/StatCard";
import TrackingMap from "./components/TrackingMap";
import ParcelTimeline from "./components/ParcelTimeline";
import { useEffect, useState } from "react";
import { getCustomerDashboard } from "../../services/deliveryApi";

function CustomerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
    const loadDashboard = async () => {
        try {
        setLoading(true);
        setError("");
        const data = await getCustomerDashboard();
        setDashboardData(data);
        } catch (err) {
        console.error("Dashboard API error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
        } finally {
        setLoading(false);
        }
    };
    loadDashboard();
    }, []);

    const recentDeliveries = dashboardData?.recentDeliveries || [];


  const statusClass = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-50 text-green-700 border-green-100";
      case "On the Way":
        return "bg-yellow-50 text-yellow-700 border-yellow-100";
      case "PENDING":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf4]">
      <div className="flex min-h-screen">

        {/* ================= MAIN ================= */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <CustomerHeader />

          <div className="p-5 lg:p-8 space-y-6">
            {/* ================= STATS ================= */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Box}
                title="Active Parcel"
                value={String(dashboardData?.stats?.active ?? 0).padStart(2, "0")}
                subtitle="Out for Delivery"
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
              />
              <StatCard
                icon={CheckCircle2}
                title="Delivered"
                value={String(dashboardData?.stats?.delivered ?? 0).padStart(2, "0")}
                subtitle="All Time"
                iconBg="bg-green-50"
                iconColor="text-green-600"
              />
              <StatCard
                icon={Clock3}
                title="Pending"
                value={String(dashboardData?.stats?.pending ?? 0).padStart(2, "0")}
                subtitle="Yet to Pick Up"
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
              />
              <StatCard
                icon={CalendarClock}
                title="Est. Arrival"
                value="20 min"
                subtitle="For Current Parcel"
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
            </section>

            {/* ================= LIVE TRACKING + STATUS ================= */}
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              {/* Live Tracking */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Live Tracking</h2>
                  <span className="flex items-center gap-2 text-sm font-semibold text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Live
                  </span>
                </div>
                <TrackingMap />
              </div>

              {/* Parcel Status */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
                <h2 className="text-xl font-bold">Parcel Status</h2>
                <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-center text-sm font-bold">
                  Parcel ID: <span className="text-orange-700">{recentDeliveries[0]?.trackingId || "No active parcel"}</span>
                </div>
                <div className="mt-5">
                  <ParcelTimeline delivery={recentDeliveries[0]} />
                </div>
              </div>
            </section>

            {/* ================= RECENT DELIVERIES + QUICK ACTIONS ================= */}
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              {/* Recent Deliveries */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <h2 className="text-xl font-bold">Recent Deliveries</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-orange-50 text-gray-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Parcel ID</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">To</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Rider</th>
                        <th className="px-5 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDeliveries.map((delivery) => (
                        <tr
                          key={delivery.trackingId}
                          className="border-t border-gray-100 hover:bg-orange-50/40 transition"
                        >
                          <td className="px-5 py-4 font-bold">{delivery.trackingId}</td>
                          <td className="px-5 py-4 text-gray-600">
                            {delivery.createdAt
                                ? new Date(delivery.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    })
                                : "-"}</td>
                          <td className="px-5 py-4">{delivery.deliveryAddress}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${statusClass(
                                delivery.status
                              )}`}
                            >
                              {delivery.status
                                ?.toLowerCase()
                                .split("_")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")}
                            </span>
                          </td>
                          <td className="px-5 py-4">{delivery.rider?.name || "-"}</td>
                          <td className="px-5 py-4">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions Placeholder */}
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
                {/* Content can be placed here */}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerDashboard;
