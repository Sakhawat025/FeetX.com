import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function RiderHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const name = user?.name || "Rider";
  const isNavigation = pathname === "/rider/navigation";
  const isProfile = pathname === "/rider/profile";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
      <div>
        <p className="text-sm text-gray-500">{isNavigation ? "Navigation" : "Welcome back,"}</p>

        <h1 className="text-2xl font-bold text-[#42210f]">{name} 👋</h1>

        <p className="mt-1 text-sm text-gray-500">
          {isNavigation
            ? "Live route to your next destination."
            : isProfile
              ? "Your rider profile and performance."
              : "Here's your delivery summary for today."}
        </p>
      </div>

      <Link to="/rider/profile" className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#42210f] font-bold text-white">
          {name[0]?.toUpperCase()}
        </span>
        <span className="font-medium text-[#42210f]">{name}</span>
      </Link>
    </header>
  );
}
