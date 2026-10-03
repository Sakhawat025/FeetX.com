import {
  LayoutDashboard,
  Package,
  MapPin,
  History,
  Bell,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

function CustomerSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/customer/dashboard" },
    { label: "My Parcels", icon: Package, path: "/customer/parcels" },
    { label: "Live Tracking", icon: MapPin, path: "/customer/tracking" },
    { label: "Delivery History", icon: History, path: "/customer/history" },
    { label: "Notifications", icon: Bell, path: "/customer/notifications", badge: 3 },
    { label: "My Profile", icon: User, path: "/customer/profile" },
    { label: "Settings", icon: Settings, path: "/customer/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex w-[264px] min-h-screen flex-col bg-[#fffaf4] border-r border-orange-100">
      {/* Logo */}
      <div className="px-7 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
            <Package className="text-white" size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#562600]">FleetX</h1>
            <p className="text-xs font-semibold text-orange-700">Delivering Trust</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 mt-5 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-4 py-3.5 transition-all ${
                  isActive
                    ? "bg-orange-700 text-white shadow-sm"
                    : "text-gray-800 hover:bg-orange-50"
                }`
              }
            >
              <div className="flex items-center gap-4">
                <Icon size={20} strokeWidth={1.8} />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Help Section */}
      <div className="mt-auto px-4 pb-5">
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-gray-900">Need Help?</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">Our support team is available 24/7.</p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-orange-500 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition"
          >
            Contact Support
          </button>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 w-full flex items-center gap-4 px-4 py-3 text-gray-800 hover:text-orange-700 transition"
        >
          <LogOut size={20} />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default CustomerSidebar;
