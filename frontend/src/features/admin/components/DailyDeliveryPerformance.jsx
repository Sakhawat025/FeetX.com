import { useEffect, useState } from "react";
import { getDailyDeliveryPerformance } from "../../../services/adminApi";

export default function DailyDeliveryPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer;

    async function loadPerformance() {
      try {
        const result = await getDailyDeliveryPerformance();

        const invalid =
          !Array.isArray(result) ||
          result.length !== 7 ||
          result.some(
            (row) =>
              !row ||
              typeof row.day !== "string" ||
              !Number.isInteger(row.delivered) ||
              row.delivered < 0 ||
              !Number.isInteger(row.cancelled) ||
              row.cancelled < 0
          );

        if (invalid) {
          throw new Error("Invalid performance data received.");
        }

        if (active) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load delivery performance."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = window.setTimeout(loadPerformance, 30000);
        }
      }
    }

    loadPerformance();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      item.delivered,
      item.cancelled,
    ])
  );

  const total = data.reduce(
    (sum, item) => sum + item.delivered + item.cancelled,
    0
  );

  return (
    <section className="w-full rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">
        Daily Delivery Performance
      </h2>

      <p className="mt-1 text-xs text-gray-500">
        Delivery activity for the last 7 days.
        Auto-refresh every 30 seconds.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}{" "}
          {data.length > 0 && "Showing last loaded data. "}
          Retrying automatically.
        </p>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-500">
          Loading performance...
        </div>
      ) : data.length > 0 ? (
        <>
          <div className="mt-5 overflow-x-auto">
            <div className="flex min-w-[420px] gap-3 border-b border-gray-100 px-2">
              {data.map((item, index) => (
                <div
                  key={`${item.day}-${index}`}
                  className="min-w-0 flex-1"
                >
                  <div
                    className="flex items-end justify-center gap-1.5"
                    style={{ height: 220 }}
                  >
                    {[
                      {
                        label: "Delivered",
                        count: item.delivered,
                        color: "bg-orange-600",
                      },
                      {
                        label: "Cancelled",
                        count: item.cancelled,
                        color: "bg-orange-300",
                      },
                    ].map(({ label, count, color }) => {
                      const height =
                        count > 0
                          ? Math.max(4, (count / maxValue) * 180)
                          : 0;

                      return (
                        <div
                          key={label}
                          title={`${item.day}: ${label} ${count}`}
                          aria-label={`${item.day}: ${label} ${count}`}
                          className={`relative w-5 rounded-t-md transition-all duration-300 sm:w-7 ${
                            count > 0 ? color : ""
                          }`}
                          style={{ height }}
                        >
                          <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-xs font-semibold text-gray-600">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="py-3 text-center text-xs text-gray-500">
                    {item.day}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-orange-600" />
              <span className="text-xs text-gray-500">
                Delivered
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-orange-300" />
              <span className="text-xs text-gray-500">
                Cancelled
              </span>
            </div>
          </div>

          {total === 0 && !error && (
            <p className="mt-3 text-center text-sm text-gray-500">
              No delivered or cancelled activity in this period.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}