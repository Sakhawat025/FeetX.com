import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function RiderHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const name = user?.name?.trim() || "Rider";

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const isNavigation = pathname === "/rider/navigation";
  const isProfile = pathname === "/rider/profile";

  const description = isNavigation
    ? "Live route to your next destination."
    : isProfile
      ? "Your rider profile and performance."
      : "Here's your delivery summary for today.";

  return (
    <header className="sticky top-0 z-[1100] bg-orange-50 px-3 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 sm:text-sm">
            {isNavigation ? "Navigation" : "Welcome back,"}
          </p>

          <h1 className="mt-1 break-words text-lg font-bold text-[#42210f] sm:text-2xl">
            {name} 👋
          </h1>

          <p className="mt-1 hidden text-sm text-gray-500 sm:block">
            {description}
          </p>
        </div>

        <Link
          to="/rider/profile"
          aria-label={`View ${name}'s profile`}
          className="flex shrink-0 items-center gap-3 rounded-xl p-2 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#42210f] text-sm font-bold text-white sm:h-12 sm:w-12">
            {initials}
          </span>

          <span className="hidden sm:block">
            <span className="block max-w-[180px] truncate font-semibold text-[#42210f]">
              {name}
            </span>

            <span className="mt-0.5 block text-xs text-gray-500">
              View Profile
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}