import { useEffect, useState } from "react";
import { Package, Search, MapPin, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyDeliveries } from "../../services/deliveryApi";

function Parcels() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      setLoading(true);
      const response = await getMyDeliveries();
      // Supports both axios response formats
      const data = response?.data ?? response;
      setParcels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load parcels:", error);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredParcels = parcels.filter((parcel) => {
    const query = search.toLowerCase();
    return (
      parcel.trackingId?.toLowerCase().includes(query) ||
      parcel.receiverName?.toLowerCase().includes(query) ||
      parcel.deliveryAddress?.toLowerCase().includes(query)
    );
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-50 text-green-600";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-50 text-orange-700";
      case "PICKED_UP":
        return "bg-blue-50 text-blue-600";
      case "CONFIRMED":
        return "bg-purple-50 text-purple-600";
      case "CANCELLED":
      case "RETURNED":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Parcels</h1>
        <p className="mt-2 text-gray-500">View and track all your deliveries.</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by tracking ID, receiver or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center">
          <Package size={32} className="mx-auto mb-3 animate-pulse text-orange-600" />
          <p className="text-gray-500">Loading your parcels...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredParcels.length === 0 && (
        <div className="rounded-2xl border border-orange-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <Package size={30} className="text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">No parcels found</h2>
          <p className="mt-2 text-sm text-gray-500">
            {search ? "Try searching with a different keyword." : "You don't have any deliveries yet."}
          </p>
        </div>
      )}

      {/* Parcel List */}
      {!loading && filteredParcels.length > 0 && (
        <div className="space-y-4">
          {filteredParcels.map((parcel) => (
            <div
              key={parcel.id}
              className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Left */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <Package size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-semibold text-gray-900">{parcel.trackingId}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(parcel.status)}`}>
                        {formatStatus(parcel.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      To: <span className="font-medium text-gray-700">{parcel.receiverName || "Receiver"}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {parcel.deliveryAddress || "Address unavailable"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString() : "Date unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <button
                  onClick={() => navigate(`/customer/tracking?trackingId=${parcel.trackingId}`)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-orange-500 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
                >
                  Track Parcel
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Parcels;
