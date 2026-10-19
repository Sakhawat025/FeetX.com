import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Navigation,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function RiderSidebar() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/rider/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Assigned Deliveries",
      path: "/rider/deliveries",
      icon: Package,
    },
    {
      name: "Navigation",
      path: "/rider/navigation",
      icon: Navigation,
    },
    {
      name: "My Profile",
      path: "/rider/profile",
      icon: User,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-orange-100 flex flex-col">
      {/* Logo */}
      <div className="h-24 px-6 flex items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#4b2100]">FleetX</h1>
          <p className="text-xs text-orange-600 font-medium">Delivering Trust</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-[#4b2100] text-white"
                    : "text-gray-700 hover:bg-orange-50"
                }`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4">
        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Need Help?</h3>
          <p className="text-sm text-gray-500 mt-2">
            Dispatch support is available 24/7.
          </p>
          <button
            type="button"
            className="mt-4 w-full py-2 rounded-xl border border-orange-500 text-orange-600 text-sm font-medium"
          >
            Contact Support
          </button>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex items-center gap-3 text-gray-700 text-sm font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default RiderSidebar;
