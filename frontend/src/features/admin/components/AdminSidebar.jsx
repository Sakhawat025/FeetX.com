import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Map,
  BarChart3,
  Users,
  Truck,
  Package,
  Zap,
  Route,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { getAdminSettings } from "../../../services/settingsApi";

function AdminSidebar() {
  const { logout } = useAuth();

  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    function apply(next) {
      if (!next) return;

      setOrganization((previous) =>
        !previous || next.version >= previous.version
          ? next
          : previous
      );
    }

    function onSaved(event) {
      apply(event.detail);
    }

    window.addEventListener(
      "fleetx:settings-saved",
      onSaved
    );

    getAdminSettings(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          apply(result);
        }
      })
      .catch(() => {
        // Settings unavailable হলেও navigation কাজ করবে।
      });

    return () => {
      controller.abort();

      window.removeEventListener(
        "fleetx:settings-saved",
        onSaved
      );
    };
  }, []);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    {
      label: "Live Fleet Map",
      icon: Map,
      path: "/admin/fleet-map",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/admin/analytics",
    },
    {
      label: "Riders",
      icon: Users,
      path: "/admin/riders",
    },
    {
      label: "Vehicles",
      icon: Truck,
      path: "/admin/vehicles",
    },
    {
      label: "Parcels",
      icon: Package,
      path: "/admin/parcels",
    },
    {
      label: "Smart Dispatch",
      icon: Zap,
      path: "/admin/smart-dispatch",
    },
    {
      label: "Route Optimization",
      icon: Route,
      path: "/admin/route-optimization",
    },
    {
      label: "Reports",
      icon: FileText,
      path: "/admin/reports",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  return (
    <aside className="hidden min-h-screen w-[264px] shrink-0 flex-col border-r border-orange-100 bg-[#fffaf4] lg:flex">
      {/* Logo */}
      <div className="px-7 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-600">
            <Package
              className="text-white"
              size={25}
            />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-lg font-extrabold tracking-tight text-[#562600]">
              {organization?.companyName || "FleetX"}
            </h1>

            <p className="break-words text-xs font-semibold text-orange-700">
              {organization?.operatingCity ||
                "Delivering Trust"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 space-y-2 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all ${
                  isActive
                    ? "bg-[#562600] text-white shadow-sm"
                    : "text-gray-800 hover:bg-orange-50"
                }`
              }
            >
              <Icon
                size={20}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span className="text-sm font-semibold">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-4 pb-5 pt-6">
        <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-gray-900">
            Need Help?
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Contact the operations support team.
          </p>

          {organization?.supportEmail ? (
            <a
              href={`mailto:${encodeURIComponent(
                organization.supportEmail
              )}`}
              className="mt-4 block w-full rounded-xl border border-orange-500 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Contact Support
            </a>
          ) : (
            <NavLink
              to="/admin/settings"
              className="mt-4 block text-sm text-orange-700 underline"
            >
              Configure support email
            </NavLink>
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="mt-5 flex w-full items-center gap-4 px-4 py-3 text-gray-800 transition hover:text-orange-700"
        >
          <LogOut size={20} />

          <span className="text-sm font-semibold">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;