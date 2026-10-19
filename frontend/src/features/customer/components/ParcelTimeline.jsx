const STEPS = [
  "Order Created",
  "Rider Assigned",
  "Parcel Picked Up",
  "Out for Delivery",
  "Delivered",
];

export default function ParcelTimeline({ delivery }) {
  if (!delivery) {
    return (
      <div className="rounded-2xl bg-white p-6 text-gray-500">
        Select a parcel to view its progress.
      </div>
    );
  }

  const status = delivery.status;
  const rider = delivery.rider;

  const terminalException = [
    "CANCELLED",
    "RETURNED",
  ].includes(status);

  const progress = {
    PENDING: 0,
    CONFIRMED: delivery.riderId || rider ? 1 : 0,
    PICKED_UP: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
  };

  const currentStep = progress[status] ?? 0;

  const phone = String(rider?.phone || "").replace(
    /[^\d+]/g,
    ""
  );

  return (
    <section className="rounded-2xl border border-orange-100 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">
        Parcel Status
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        #{delivery.trackingId}
      </p>

      {terminalException ? (
        <p className="mt-5 rounded-xl bg-red-50 p-4 font-medium text-red-700">
          This parcel is {status.toLowerCase()}.
        </p>
      ) : (
        <ol className="mt-6 space-y-5">
          {STEPS.map((label, index) => {
            const reached = index <= currentStep;

            return (
              <li
                key={label}
                aria-current={
                  index === currentStep ? "step" : undefined
                }
                className="flex items-center gap-3"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    reached
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {reached ? "✓" : index + 1}
                </span>

                <span
                  className={
                    reached
                      ? "font-medium text-gray-900"
                      : "text-gray-400"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 border-t border-orange-100 pt-4">
        <p className="text-sm text-gray-500">
          Assigned Rider
        </p>

        <p className="mt-1 font-semibold">
          {rider?.name || "Not assigned yet"}
        </p>

        {phone && (
          <a
            href={`tel:${phone}`}
            className="mt-1 inline-block text-sm text-orange-600"
          >
            {rider.phone}
          </a>
        )}
      </div>
    </section>
  );
}