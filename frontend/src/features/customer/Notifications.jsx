import { Bell } from "lucide-react";

function Notifications() {
  return (
    <div className="min-h-screen bg-[#fffaf3] px-6 py-8 lg:px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-2 text-gray-500">Stay updated with your delivery notifications.</p>
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
            <Bell size={24} className="text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">No new notifications</h2>
            <p className="mt-1 text-sm text-gray-500">You're all caught up.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
