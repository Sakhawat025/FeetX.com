import { Bell, ChevronDown } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="h-[78px] bg-[#fffaf3] border-b border-orange-100 px-7 flex items-center justify-between">
      {/* Left */}
      <div>
        <p className="text-sm text-gray-500">Operations Overview</p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <span className="text-xl">👋</span>
        </div>
        <p className="text-xs text-gray-500">Monitor and control fleet operations in real time.</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* Notification */}
        <button
          type="button"
          className="relative w-10 h-10 rounded-full bg-white border border-orange-100 flex items-center justify-center shadow-sm hover:bg-orange-50 transition"
        >
          <Bell size={19} className="text-gray-700" />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            0
          </span>
        </button>

        {/* Admin Profile */}
        <button type="button" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#562600] text-white flex items-center justify-center text-sm font-bold">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{user?.name || "Admin Panel"}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
