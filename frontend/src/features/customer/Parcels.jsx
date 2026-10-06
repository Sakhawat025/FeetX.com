import { useEffect, useState } from "react";
import {
  Package,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getMyDeliveries,
  createDelivery,
} from "../../services/deliveryApi";

function Parcels() {
  const navigate = useNavigate();

  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create parcel states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [formData, setFormData] = useState({
    senderName: "",
    receiverName: "",
    receiverPhone: "",
    pickupAddress: "",
    deliveryAddress: "",
    parcelType: "Document",
    parcelWeight: "",
  });

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      setLoading(true);

      const response = await getMyDeliveries();
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

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      senderName: "",
      receiverName: "",
      receiverPhone: "",
      pickupAddress: "",
      deliveryAddress: "",
      parcelType: "Document",
      parcelWeight: "",
    });

    setCreateError("");
  };

  // Create new parcel
  const handleCreateParcel = async (e) => {
    e.preventDefault();

    setCreateError("");

    if (
      !formData.senderName ||
      !formData.receiverName ||
      !formData.pickupAddress ||
      !formData.deliveryAddress ||
      !formData.parcelType
    ) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    try {
      setCreating(true);

      await createDelivery({
        senderName: formData.senderName,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone || undefined,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        parcelType: formData.parcelType,
        parcelWeight: formData.parcelWeight
          ? Number(formData.parcelWeight)
          : undefined,
      });

      resetForm();
      setShowCreateForm(false);

      // Refresh parcel list
      await loadParcels();
    } catch (error) {
      console.error("Failed to create parcel:", error);

      setCreateError(
        error?.response?.data?.message ||
          "Failed to create parcel. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf3] px-6 py-8 lg:px-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Parcels
          </h1>

          <p className="mt-2 text-gray-500">
            View and track all your deliveries.
          </p>
        </div>

        {/* Create Parcel Button */}
        <button
          onClick={() => {
            setCreateError("");
            setShowCreateForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          <Plus size={18} />
          Create Parcel
        </button>
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
          <Package
            size={32}
            className="mx-auto mb-3 animate-pulse text-orange-600"
          />

          <p className="text-gray-500">
            Loading your parcels...
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredParcels.length === 0 && (
        <div className="rounded-2xl border border-orange-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <Package size={30} className="text-orange-600" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            No parcels found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {search
              ? "Try searching with a different keyword."
              : "You don't have any deliveries yet."}
          </p>

          {!search && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <Plus size={17} />
              Create Your First Parcel
            </button>
          )}
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
                    <Package
                      size={24}
                      className="text-orange-600"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-semibold text-gray-900">
                        {parcel.trackingId}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          parcel.status
                        )}`}
                      >
                        {formatStatus(parcel.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      To:{" "}
                      <span className="font-medium text-gray-700">
                        {parcel.receiverName || "Receiver"}
                      </span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {parcel.deliveryAddress ||
                          "Address unavailable"}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {parcel.createdAt
                          ? new Date(
                              parcel.createdAt
                            ).toLocaleDateString()
                          : "Date unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <button
                  onClick={() =>
                    navigate(
                      `/customer/tracking?trackingId=${parcel.trackingId}`
                    )
                  }
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

      {/* Create Parcel Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Parcel
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the parcel delivery details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateParcel}
              className="space-y-5 p-6"
            >
              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {createError}
                </div>
              )}

              {/* Sender / Receiver */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Sender Name *
                  </label>

                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleChange}
                    placeholder="Enter sender name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Receiver Name *
                  </label>

                  <input
                    type="text"
                    name="receiverName"
                    value={formData.receiverName}
                    onChange={handleChange}
                    placeholder="Enter receiver name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Receiver Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Receiver Phone
                </label>

                <input
                  type="tel"
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleChange}
                  placeholder="Enter receiver phone number"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                />
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Pickup Address *
                  </label>

                  <input
                    type="text"
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                    placeholder="Enter pickup address"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Delivery Address *
                  </label>

                  <input
                    type="text"
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    placeholder="Enter delivery address"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Parcel Type / Weight */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parcel Type *
                  </label>

                  <select
                    name="parcelType"
                    value={formData.parcelType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                  >
                    <option value="Document">Document</option>
                    <option value="Package">Package</option>
                    <option value="Fragile">Fragile</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parcel Weight (kg)
                  </label>

                  <input
                    type="number"
                    name="parcelWeight"
                    value={formData.parcelWeight}
                    onChange={handleChange}
                    placeholder="e.g. 1"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Parcel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Parcels;