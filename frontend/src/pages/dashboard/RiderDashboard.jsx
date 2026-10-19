import RiderLayout from "../../features/rider/components/RiderLayout";
import { useEffect, useState } from "react";
import { getRiderDashboardStats, getCurrentTask } from "../../services/riderApi";

function RiderDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const statsData = await getRiderDashboardStats();
        const taskData = await getCurrentTask();

        console.log("Rider Dashboard Data:", statsData);
        console.log("Current Task:", taskData);

        setStats(statsData || {});
        setCurrentTask(taskData || null);
      } catch (error) {
        console.error("Failed to load rider dashboard:", error);
        setStats({});
        setCurrentTask(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <RiderLayout>
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <DashboardCard
          title="Today's Deliveries"
          value={loading ? "..." : stats?.todayDeliveries || 0}
        />
        <DashboardCard
          title="Completed"
          value={loading ? "..." : stats?.completed || 0}
        />
        <DashboardCard
          title="Pending"
          value={loading ? "..." : stats?.pending || 0}
        />
        <DashboardCard
          title="Rating"
          value={loading ? "..." : stats?.rating || 0}
          sub={`${stats?.totalDeliveries || 0}+ deliveries`}
        />
      </div>

      {/* Current Task */}
      <div className="mt-5 bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
        <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">
          Current Task
        </span>

        <h2 className="mt-4 text-xl font-bold text-gray-900">
          {currentTask
            ? `#${currentTask.trackingId} - ${currentTask.parcelType}`
            : "No active delivery"}
        </h2>

        <div className="flex flex-wrap gap-8 mt-4 text-sm">
          <div>
            <p className="text-gray-400">Pickup</p>
            <p className="font-medium">{currentTask?.pickupAddress || "-"}</p>
          </div>
          <div>
            <p className="text-gray-400">Drop</p>
            <p className="font-medium">{currentTask?.deliveryAddress || "-"}</p>
          </div>
          <div>
            <p className="text-gray-400">Distance</p>
            <p className="font-medium">
              {currentTask?.distance ? `${currentTask.distance} km` : "-"}
            </p>
          </div>
        </div>

        <button
          disabled={!currentTask}
          className={`mt-5 px-6 py-3 rounded-xl text-sm font-medium ${
            currentTask
              ? "bg-[#4b2100] text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Open Navigation
        </button>
      </div>

      {/* Performance Summary */}
      <div className="mt-5 bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">
          Performance Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <SmallStat
            value={loading ? "..." : stats?.totalDeliveries || 0}
            label="Total Deliveries"
          />
          <SmallStat
            value={loading ? "..." : stats?.thisMonth || 0}
            label="This Month"
          />
          <SmallStat
            value={loading ? "..." : stats?.onTimeRate || "0%"}
            label="On-Time Rate"
          />
          <SmallStat
            value={loading ? "..." : stats?.avgDeliveryTime || "-"}
            label="Avg. Delivery Time"
          />
        </div>
      </div>
    </RiderLayout>
  );
}

function DashboardCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-[#4b2100]">{value}</h2>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  );
}

function SmallStat({ value, label }) {
  return (
    <div className="bg-orange-50 rounded-xl p-5 text-center">
      <h3 className="text-2xl font-bold text-[#4b2100]">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default RiderDashboard;
