import AdminLayout from "../../features/admin/components/AdminLayout";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/adminApi";
import AdminHeader from "../../features/admin/components/AdminHeader";
import LiveRiders from "../../features/admin/components/LiveRiders";
import LiveFleetMap from "../../features/admin/components/LiveFleetMap";
import DailyDeliveryPerformance from "../../features/admin/components/DailyDeliveryPerformance";
import PendingAssignment from "../../features/admin/components/PendingAssignment";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardStats();
  }, []);

  return (
    <AdminLayout>
      <AdminHeader />
      <div className="bg-orange-50 px-6 pb-8">
        <div className="w-full max-w-[1500px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 pt-5">
            <Card title="Total Deliveries" value={loading ? "..." : stats?.totalDeliveries ?? 0} />
            <Card title="Active Riders" value={loading ? "..." : stats?.activeRiders ?? 0} />
            <Card title="Available Vehicles" value="N/A" />
            <Card title="Pending Orders" value={loading ? "..." : stats?.pendingDeliveries ?? 0} />
            <Card title="Completed" value={loading ? "..." : stats?.completedDeliveries ?? 0} />
            <Card title="Cancelled" value={loading ? "..." : stats?.cancelledDeliveries ?? 0} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
            <div className="xl:col-span-2 min-w-0">
              <LiveFleetMap />
            </div>
            <div className="xl:col-span-1 min-w-0">
              <LiveRiders />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
            <div className="xl:col-span-2 min-w-0">
              <DailyDeliveryPerformance />
            </div>
            <div className="xl:col-span-1">
                <PendingAssignment />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold text-gray-900 mt-1">{value}</h2>
    </div>
  );
}

export default AdminDashboard;
