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

function CustomerDashboard() {
  const recentDeliveries = [
    {
      id: "#PKG10244",
      date: "18 May 2025",
      to: "Uttara, Dhaka",
      status: "Delivered",
      rider: "Karim Ahmed",
    },
    {
      id: "#PKG10243",
      date: "17 May 2025",
      to: "Dhanmondi, Dhaka",
      status: "On the Way",
      rider: "Rashed Ali",
    },
    {
      id: "#PKG10242",
      date: "17 May 2025",
      to: "Mohammadpur, Dhaka",
      status: "Pending",
      rider: "-",
    },
    {
      id: "#PKG10241",
      date: "16 May 2025",
      to: "Farmgate, Dhaka",
      status: "Delivered",
      rider: "Karim Ahmed",
    },
  ];

  const statusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-100";
      case "On the Way":
        return "bg-yellow-50 text-yellow-700 border-yellow-100";
      case "Pending":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "Out for Delivery":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Cancelled":
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
                value="01"
                subtitle="Out for Delivery"
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
              />
              <StatCard
                icon={CheckCircle2}
                title="Delivered"
                value="25"
                subtitle="All Time"
                iconBg="bg-green-50"
                iconColor="text-green-600"
              />
              <StatCard
                icon={Clock3}
                title="Pending"
                value="03"
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
                  Parcel ID: <span className="text-orange-700">#PKG10245</span>
                </div>
                <div className="mt-5">
                  <ParcelTimeline />
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
                          key={delivery.id}
                          className="border-t border-gray-100 hover:bg-orange-50/40 transition"
                        >
                          <td className="px-5 py-4 font-bold">{delivery.id}</td>
                          <td className="px-5 py-4 text-gray-600">{delivery.date}</td>
                          <td className="px-5 py-4">{delivery.to}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${statusClass(
                                delivery.status
                              )}`}
                            >
                              {delivery.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">{delivery.rider}</td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 px-3 py-1.5 text-orange-700 hover:bg-orange-50 transition"
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
