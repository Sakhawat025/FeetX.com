import { useEffect, useState } from "react";
import {
  MapPin,
  Package,
  Clock,
  Navigation,
  ArrowLeft,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getMyDeliveries } from "../../services/deliveryApi";
import ParcelTimeline from "./components/ParcelTimeline";

function Tracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackingId = searchParams.get("trackingId");
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadParcel();
  }, [trackingId]);

  const loadParcel = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMyDeliveries();
      const data = response?.data ?? response;

      if (!Array.isArray(data)) {
        setParcel(null);
        setError("Unable to load parcel data.");
        return;
      }

      const foundParcel = data.find(
        (item) => item.trackingId === trackingId
      );

      if (!foundParcel) {
        setParcel(null);
        setError("Parcel not found.");
        return;
      }

      setParcel(foundParcel);
    } catch (err) {
      console.error("Failed to load tracking data:", err);
      setParcel(null);
      setError("Failed to load parcel information.");
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3] flex items-center justify-center">
        <div className="text-center">
          <Package
            size={36}
            className="mx-auto mb-3 animate-pulse text-orange-600"
          />
          <p className="text-gray-500">
            Loading parcel information...
          </p>
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="min-h-screen bg-[#fffaf3] flex items-center justify-center px-6">
        <div className="bg-white border border-orange-100 rounded-2xl p-8 text-center max-w-md w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
            <Package size={28} className="text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Parcel Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {error || "We couldn't find this parcel."}
          </p>
          <button
            onClick={() => navigate("/customer/parcels")}
            className="mt-6 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Back to My Parcels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 px-6 py-6 lg:px-10">
        <button
          onClick={() => navigate("/customer/parcels")}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          <ArrowLeft size={17} />
          Back to My Parcels
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Live Tracking
        </h1>
        <p className="mt-2 text-gray-500">
          Track your parcel delivery progress.
        </p>
      </header>
      <section className="p-6 lg:p-10">
        {/* Tracking Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Tracking ID */}
          <div className="bg-white border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <Package
                  size={23}
                  className="text-orange-700"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">
                  Tracking ID
                </p>
                <p className="font-bold text-gray-900 truncate">
                  {parcel.trackingId}
                </p>
              </div>
            </div>
          </div>
          {/* Status */}
          <div className="bg-white border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Navigation
                  size={23}
                  className="text-purple-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>
                <span
                  className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                    parcel.status
                  )}`}
                >
                  {formatStatus(parcel.status)}
                </span>
              </div>
            </div>
          </div>
          {/* Parcel Type */}
          <div className="bg-white border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Package
                  size={23}
                  className="text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Parcel Type
                </p>
                <p className="font-bold text-gray-900">
                  {parcel.parcelType || "Not specified"}
                </p>
              </div>
            </div>
          </div>
          {/* Weight */}
          <div className="bg-white border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <Clock
                  size={23}
                  className="text-green-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Weight
                </p>
                <p className="font-bold text-gray-900">
                  {parcel.parcelWeight ?? "-"} kg
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          {/* Pickup */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 shrink-0 rounded-full bg-green-50 flex items-center justify-center">
                <MapPin
                  size={22}
                  className="text-green-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Pickup Address
                </p>
                <p className="mt-1 font-bold text-gray-900">
                  {parcel.pickupAddress || "Address unavailable"}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Sender:{" "}
                  <span className="font-medium text-gray-900">
                    {parcel.senderName || "Anonymous"}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {/* Delivery / Destination */}
          <div className="bg-white border border-orange-100 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 shrink-0 rounded-full bg-orange-50 flex items-center justify-center">
                <MapPin
                  size={22}
                  className="text-orange-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Delivery Address
                </p>
                <p className="mt-1 font-bold text-gray-900">
                  {parcel.deliveryAddress || "Address unavailable"}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Recipient:{" "}
                  <span className="font-medium text-gray-900">
                    {parcel.recipientName || "Anonymous"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
                {/* Parcel Timeline */}
        <ParcelTimeline delivery={parcel} />
      </section>
    </div>
  );
}

export default Tracking;
