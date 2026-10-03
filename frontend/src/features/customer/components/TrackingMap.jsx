import { MapPin, Bike, Navigation } from "lucide-react";

function TrackingMap() {
  return (
    <div className="relative w-full h-[340px] rounded-2xl overflow-hidden bg-[#eef3df] border border-orange-100">
      {/* Map background */}
      <div className="absolute inset-0">
        {/* Roads */}
        <div className="absolute top-[18%] left-[-5%] w-[115%] h-[2px] bg-white rotate-[28deg]" />
        <div className="absolute top-[42%] left-[-5%] w-[115%] h-[2px] bg-white rotate-[28deg]" />
        <div className="absolute top-[68%] left-[-5%] w-[115%] h-[2px] bg-white rotate-[28deg]" />
        <div className="absolute top-[88%] left-[-5%] w-[115%] h-[2px] bg-white rotate-[28deg]" />

        <div className="absolute left-[20%] top-[-10%] w-[2px] h-[120%] bg-white rotate-[12deg]" />
        <div className="absolute left-[48%] top-[-10%] w-[2px] h-[120%] bg-white rotate-[12deg]" />
        <div className="absolute left-[75%] top-[-10%] w-[2px] h-[120%] bg-white rotate-[12deg]" />
      </div>

      {/* Area names */}
      <span className="absolute top-[28%] left-[18%] text-gray-500 font-medium">Mirpur</span>
      <span className="absolute top-[35%] left-[57%] text-gray-500 font-medium">Gulshan</span>
      <span className="absolute bottom-[22%] left-[35%] text-gray-500 font-medium">Mohakhali</span>
      <span className="absolute bottom-[25%] left-[65%] text-gray-500 font-medium">Tejgaon</span>

      {/* Route */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 340"
        preserveAspectRatio="none"
      >
        <path
          d="M120 270 C270 270 300 230 410 175 C520 120 650 120 850 75"
          fill="none"
          stroke="#3b9bf3"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      {/* Starting point */}
      <div className="absolute left-[12%] bottom-[17%] w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow" />

      {/* Rider */}
      <div className="absolute left-[48%] top-[45%] w-12 h-12 rounded-full bg-orange-500 border-4 border-white shadow-lg flex items-center justify-center">
        <Bike className="text-white" size={22} />
      </div>

      {/* Rider information */}
      <div className="absolute left-[34%] top-[17%] bg-white rounded-xl shadow-lg px-4 py-3 min-w-[145px]">
        <p className="text-xs font-bold text-gray-900">Rider: Karim Ahmed</p>
        <p className="text-xs text-gray-500 mt-1">Honda CB Shine</p>
        <p className="text-xs text-orange-500 mt-1 font-medium">★ 4.8</p>
      </div>

      {/* Destination */}
      <div className="absolute right-[10%] top-[20%] bg-white rounded-xl shadow px-4 py-2.5 flex items-center gap-2">
        <MapPin size={16} className="text-red-500" />
        <span className="text-xs font-medium text-gray-800">Banani, Dhaka</span>
      </div>

      {/* Distance */}
      <div className="absolute left-4 bottom-4 bg-white rounded-xl shadow px-4 py-3">
        <p className="text-[11px] text-gray-500">Distance Left</p>
        <p className="text-xl font-bold text-gray-900">3.2 km</p>
      </div>

      {/* ETA */}
      <div className="absolute right-4 bottom-4 bg-white rounded-xl shadow px-4 py-3">
        <p className="text-[11px] text-gray-500">ETA</p>
        <p className="text-xl font-bold text-gray-900">20 min</p>
      </div>

      {/* Destination marker */}
      <div className="absolute right-[9%] top-[23%] translate-y-8 w-6 h-6 rounded-full bg-red-500 border-4 border-white shadow" />

      {/* Navigation indicator */}
      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
        <Navigation size={17} className="text-gray-700" />
      </div>
    </div>
  );
}

export default TrackingMap;
