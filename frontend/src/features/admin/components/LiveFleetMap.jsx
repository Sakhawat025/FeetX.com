import { MapPin } from "lucide-react";

function LiveFleetMap() {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Live Fleet Map</h2>
        <span className="text-xs font-medium text-green-600">● Riders active</span>
      </div>

      <div className="relative mt-4 h-[320px] overflow-hidden rounded-xl bg-[#eee8d8]">
        {/* Map roads */}
        <div className="absolute left-[15%] top-0 h-full w-[4px] bg-[#d9ceb0]" />
        <div className="absolute left-[40%] top-0 h-full w-[4px] bg-[#d9ceb0]" />
        <div className="absolute left-[65%] top-0 h-full w-[4px] bg-[#d9ceb0]" />
        <div className="absolute left-[88%] top-0 h-full w-[4px] bg-[#d9ceb0]" />
        <div className="absolute left-0 top-[35%] h-[4px] w-full bg-[#d9ceb0]" />
        <div className="absolute left-0 top-[65%] h-[4px] w-full bg-[#d9ceb0]" />

        {/* Rider marker */}
        <div className="absolute left-[18%] top-[28%] flex flex-col items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white shadow">
            <MapPin size={18} />
          </div>
          <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium shadow-sm">
            Test Rider
          </span>
        </div>

        {/* Map controls */}
        <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-lg bg-white shadow">
          <button type="button" className="px-3 py-2 text-gray-700 hover:bg-gray-50">+</button>
          <button type="button" className="border-t px-3 py-2 text-gray-700 hover:bg-gray-50">−</button>
        </div>
      </div>
    </div>
  );
}

export default LiveFleetMap;
