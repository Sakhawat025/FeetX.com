import { Bell } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function CustomerHeader() {
  const { user } = useAuth();
  const userName = user?.name || "Customer";

  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-[126px] bg-[#fffdf9] border-b border-orange-100 px-8 flex items-center justify-between">
      {/* Welcome */}
      <div>
        <p className="text-sm text-gray-500">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-950">
          {userName} <span className="text-xl">👋</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your deliveries.</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Notification */}
        <button className="relative w-12 h-12 rounded-full bg-white border border-orange-100 flex items-center justify-center hover:bg-orange-50 transition">
          <Bell size={21} className="text-gray-800" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">Customer</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CustomerHeader;
