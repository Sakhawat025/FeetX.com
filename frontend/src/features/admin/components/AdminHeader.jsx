import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function AdminHeader() {
  const { user, logout } = useAuth();

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
          onClick={logout}
          aria-label="Logout"
          title="Logout"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-orange-200 bg-white p-2 text-orange-700 transition hover:bg-orange-50"
        >
          <LogOut size={18} />
          <span className="hidden text-sm font-semibold sm:inline">Logout</span>
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
