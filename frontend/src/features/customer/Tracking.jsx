import { MapPin, Package, Clock, Navigation } from "lucide-react";

function Tracking() {
  return (
    <div className="min-h-screen bg-[#fffaf3] flex">

      <main className="flex-1">
        {/* Header */}
        <header className="px-8 py-7 border-b border-orange-100 bg-white">
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="mt-2 text-gray-500">Track your parcel in real-time on the map.</p>
        </header>

        <section className="p-8">
          {/* Tracking Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-white border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <Package size={23} className="text-orange-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Parcel ID</p>
                  <p className="font-bold text-gray-900">#PKG10245</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <Navigation size={23} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-bold text-gray-900">Out for Delivery</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Clock size={23} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">ETA</p>
                  <p className="font-bold text-gray-900">20 min</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <MapPin size={23} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distance Left</p>
                  <p className="font-bold text-gray-900">3.2 km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mt-6 bg-white border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Live Tracking</h2>
                <p className="text-sm text-gray-500 mt-1">Rider is currently on the way.</p>
              </div>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Live
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden bg-[#eef2df] border border-gray-100">
              {/* Map lines */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-16 left-0 w-full h-px bg-white rotate-12" />
                <div className="absolute top-32 left-0 w-full h-px bg-white -rotate-12" />
                <div className="absolute top-56 left-0 w-full h-px bg-white rotate-12" />
                <div className="absolute top-72 left-0 w-full h-px bg-white -rotate-12" />
                <div className="absolute left-1/4 top-0 h-full w-px bg-white rotate-12" />
                <div className="absolute left-1/2 top-0 h-full w-px bg-white -rotate-12" />
                <div className="absolute left-3/4 top-0 h-full w-px bg-white rotate-12" />
              </div>

              {/* Location labels */}
              <span className="absolute top-20 left-[18%] text-gray-500">Mirpur</span>
              <span className="absolute top-24 right-[28%] text-gray-500">Gulshan</span>
              <span className="absolute bottom-20 left-[35%] text-gray-500">Mohakhali</span>
              <span className="absolute bottom-24 right-[30%] text-gray-500">Tejgaon</span>

              {/* Route */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1000 400"
                preserveAspectRatio="none"
              >
                <path
                  d="M130 300 C300 300 350 220 500 180 C650 140 760 120 870 80"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>

              {/* Starting Point */}
              <div className="absolute left-[12%] bottom-[23%] w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow" />

              {/* Rider */}
              <div className="absolute left-[48%] top-[40%] w-12 h-12 rounded-full bg-orange-600 border-4 border-white shadow-lg flex items-center justify-center">
                <Navigation size={22} className="text-white" />
              </div>

              {/* Destination */}
              <div className="absolute right-[11%] top-[17%] w-5 h-5 rounded-full bg-red-500 border-4 border-white shadow" />

              {/* Rider Info */}
              <div className="absolute left-[43%] top-[18%] bg-white rounded-xl shadow-lg px-4 py-3">
                <p className="font-semibold text-gray-900 text-sm">Rider: Karim Ahmed</p>
                <p className="text-xs text-gray-500 mt-1">Honda CB Shine</p>
                <p className="text-xs text-orange-600 mt-1">★ 4.8</p>
              </div>

              {/* Distance */}
              <div className="absolute bottom-5 left-5 bg-white rounded-xl shadow px-4 py-3">
                <p className="text-xs text-gray-500">Distance Left</p>
                <p className="text-lg font-bold text-gray-900">3.2 km</p>
              </div>

              {/* ETA */}
              <div className="absolute bottom-5 right-5 bg-white rounded-xl shadow px-4 py-3">
                <p className="text-xs text-gray-500">ETA</p>
                <p className="text-lg font-bold text-gray-900">20 min</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Tracking;
