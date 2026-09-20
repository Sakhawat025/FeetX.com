function DashboardPreview() {
  const deliveries = [
    {
      name: "Parcel #1024",
      rider: "Alex Rider",
      status: "On Route"
    },
    {
      name: "Parcel #1025",
      rider: "John Smith",
      status: "Delivered"
    },
    {
      name: "Parcel #1026",
      rider: "Michael Lee",
      status: "Preparing"
    }
  ];

  return (
    <section id = "solutions" className="bg-orange-50 py-20 px-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <h2 className="text-4xl font-extrabold text-gray-950">
            Complete Control Over Your Delivery Operations
          </h2>

          <p className="mt-5 text-gray-600 leading-relaxed">
            Manage your entire fleet from one intelligent dashboard.
            Track riders, monitor deliveries and analyze operational
            performance in real time.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-700 text-white flex items-center justify-center">
                ✓
              </div>
              <p>Live fleet location monitoring</p>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-700 text-white flex items-center justify-center">
                ✓
              </div>
              <p>Delivery performance analytics</p>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-700 text-white flex items-center justify-center">
                ✓
              </div>
              <p>Smart rider assignment</p>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-orange-100">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl text-orange-900">
              Fleet Dashboard
            </h3>
            <span className="text-sm text-green-600">● Live</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-orange-50 rounded-xl p-4">
              <h4 className="font-bold text-2xl">128</h4>
              <p className="text-xs text-gray-500">Active Riders</p>
            </div>

            <div className="bg-orange-50 rounded-xl p-4">
              <h4 className="font-bold text-2xl">540</h4>
              <p className="text-xs text-gray-500">Deliveries</p>
            </div>

            <div className="bg-orange-50 rounded-xl p-4">
              <h4 className="font-bold text-2xl">96%</h4>
              <p className="text-xs text-gray-500">Success</p>
            </div>
          </div>

          {/* Map Area */}
          <div className="mt-6 h-52 bg-slate-100 rounded-2xl relative overflow-hidden">
            <div className="absolute top-10 left-16 w-3 h-3 bg-green-600 rounded-full"></div>
            <div className="absolute top-24 left-48 w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="absolute bottom-12 right-20 w-3 h-3 bg-orange-600 rounded-full"></div>
            <div className="absolute top-24 left-20 w-56 border-t-2 border-dashed border-orange-500 rotate-12"></div>
          </div>

          {/* Delivery List */}
          <div className="mt-6 space-y-3">
            {deliveries.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-50 rounded-xl p-3"
              >
                <div>
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-500">{item.rider}</p>
                </div>
                <span className="text-xs text-orange-700 font-medium">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPreview;
