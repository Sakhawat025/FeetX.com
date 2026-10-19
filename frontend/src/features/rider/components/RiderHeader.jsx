import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getRiderDashboardStats } from "../../../services/riderApi";

function RiderHeader() {
  const [rider, setRider] = useState(null);

  useEffect(() => {
    const loadRider = async () => {
      try {
        const data = await getRiderDashboardStats();
        setRider(data);
      } catch (error) {
        console.error("Failed to load rider info:", error);
      }
    };

    loadRider();
  }, []);

  const name = rider?.name || "Rider";

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 1)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-8 py-5">
      {/* Left Section */}
      <div>
        <p className="text-sm text-gray-500">
          Welcome back,
        </p>
        <h1 className="text-2xl font-bold text-[#4b2100]">
          {name} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's your delivery summary for today.
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">
        {/* Notification */}
        <div className="relative">
          <Bell size={22} className="text-gray-700" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            2
          </span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#4b2100] text-white flex items-center justify-center font-semibold">
            {initials}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">
              {name}
            </p>
            <p className="text-xs text-gray-500">
              Rider
            </p>
          </div>

          <span className="text-gray-400">
            ˅
          </span>
        </div>
      </div>
    </header>
  );
}

export default RiderHeader;
