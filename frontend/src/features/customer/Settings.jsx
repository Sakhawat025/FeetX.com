import { Settings as SettingsIcon } from "lucide-react";

function Settings() {
  return (
    <div className="min-h-screen bg-[#fffaf3] flex">

      <main className="flex-1">
        {/* Header */}
        <header className="px-8 py-7 border-b border-orange-100 bg-white">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-500">Manage your account, preferences and app settings.</p>
        </header>

        {/* Content */}
        <section className="p-8">
          <div className="bg-white border border-orange-100 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <SettingsIcon size={24} className="text-orange-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your FleetX preferences.</p>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900">Notification Settings</h3>
              <div className="mt-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Order Updates</p>
                    <p className="text-sm text-gray-500">Receive notifications about your orders.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-orange-700" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Rider Updates</p>
                    <p className="text-sm text-gray-500">Get notified when your rider status changes.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-orange-700" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Promotions & Offers</p>
                    <p className="text-sm text-gray-500">Receive promotions, offers and discounts.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-orange-700" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;
