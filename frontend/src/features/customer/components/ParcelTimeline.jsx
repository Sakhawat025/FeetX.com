import {
  CheckCircle2,
  UserCheck,
  PackageCheck,
  Bike,
  Home,
} from "lucide-react";

function ParcelTimeline({ delivery }) {
  const status = delivery?.status?.toUpperCase() || "PENDING";

  const riderName =
    delivery?.rider?.name ||
    delivery?.rider?.fullName ||
    "Rider not assigned";

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isStatusReached = (targetStatus) => {
    const statusOrder = {
      PENDING: 0,
      ASSIGNED: 1,
      PICKED_UP: 2,
      OUT_FOR_DELIVERY: 3,
      DELIVERED: 4,
    };
    const currentOrder = statusOrder[status] ?? 0;
    const targetOrder = statusOrder[targetStatus] ?? 0;
    return currentOrder >= targetOrder;
  };

  const timelineItems = [
    {
      title: "Order Confirmed",
      description: "Your parcel has been confirmed",
      time: formatTime(delivery?.createdAt),
      icon: CheckCircle2,
      completed: true,
    },
    {
      title: "Rider Assigned",
      description: delivery?.rider
        ? `${riderName} has been assigned`
        : "Waiting for rider assignment",
      time: "",
      icon: UserCheck,
      completed: isStatusReached("ASSIGNED"),
    },
    {
      title: "Parcel Picked Up",
      description: "Parcel picked up from sender",
      time: "",
      icon: PackageCheck,
      completed: isStatusReached("PICKED_UP"),
    },
    {
      title: "Out for Delivery",
      description: "Your parcel is on the way",
      time: "",
      icon: Bike,
      completed: isStatusReached("OUT_FOR_DELIVERY"),
      current: status === "OUT_FOR_DELIVERY",
    },
    {
      title: "Delivered",
      description: status === "DELIVERED"
        ? "Your parcel has been delivered"
        : "Waiting for delivery",
      time: status === "DELIVERED" ? formatTime(delivery?.updatedAt) : "",
      icon: Home,
      completed: status === "DELIVERED",
    },
  ];

  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-lg font-bold text-gray-950">Parcel Status</h2>
          <p className="text-sm text-gray-500 mt-1">Track your parcel's delivery progress</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
          {delivery?.trackingId || "No active parcel"}
        </span>
      </div>

      <div className="relative">
        {timelineItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === timelineItems.length - 1;

          return (
            <div key={item.title} className="relative flex gap-4">
              {/* Timeline line */}
              {!isLast && (
                <div
                  className={`absolute left-[19px] top-[42px] w-[2px] h-[62px] ${
                    item.completed ? "bg-orange-500" : "bg-gray-200"
                  }`}
                />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-4 border-white ${
                  item.current
                    ? "bg-orange-700 text-white shadow-md"
                    : item.completed
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
              </div>

              {/* Content */}
              <div className={`flex-1 ${isLast ? "pb-0" : "pb-7"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        item.completed || item.current ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`mt-1 text-xs ${
                        item.completed || item.current ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                  {item.time && (
                    <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                  )}
                </div>
                {item.current && (
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-semibold">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ParcelTimeline;
