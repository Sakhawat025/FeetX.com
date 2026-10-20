import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { getTracking } from "../../services/trackingApi";

export default function LiveLocationMap({
  endpoint,
  onData,
  selectedRiderId = null,
  onSelectRider,
  showRiderList = true,
  height = 360,
}) {
  const elementRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const centeredRef = useRef(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const map = L.map(elementRef.current).setView(
      [23.8103, 90.4125],
      11
    );

    L.tileLayer(
      import.meta.env.VITE_MAP_TILE_URL ||
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          import.meta.env.VITE_MAP_ATTRIBUTION ||
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    const markers = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersRef.current = markers;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer;

    centeredRef.current = false;
    markersRef.current?.clearLayers();
    setResult(null);
    setError("");

    if (!endpoint) return;

    async function load() {
      try {
        const data = await getTracking(endpoint);

        if (!Array.isArray(data.riders)) {
          throw new Error("Invalid tracking response");
        }

        if (active) {
          setResult({ endpoint, ...data });
          setError("");
        }
      } catch (err) {
        if (active) {
          setResult(null);
          setError(
            err.response?.data?.message ||
              "Location refresh failed. Retrying..."
          );
        }
      } finally {
        if (active) {
          timer = window.setTimeout(load, 10000);
        }
      }
    }

    load();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [endpoint]);

  useEffect(() => {
    onData?.(result?.endpoint === endpoint ? result : null);
  }, [result, endpoint, onData]);

  const riders = result?.endpoint === endpoint
    ? result.riders.filter((rider) => {
        const age = now - new Date(rider.capturedAt).getTime();

        return (
          Number.isFinite(rider.latitude) &&
          Number.isFinite(rider.longitude) &&
          Number.isFinite(age) &&
          age <= 120000
        );
      })
    : [];

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    for (const rider of riders) {
      const age = now - new Date(rider.capturedAt).getTime();
      const outdated = age > 30000;

      const text = document.createElement("span");
      text.textContent = `${rider.name} — ${
        outdated ? "Outdated location" : "Recent GPS"
      }`;

      L.circleMarker(
        [rider.latitude, rider.longitude],
        {
          radius: 10,
          color: "#ffffff",
          weight: 3,
          fillColor:
            rider.id === selectedRiderId
              ? "#42200e"
              : outdated
              ? "#9ca3af"
              : "#df7517",
          fillOpacity: 1,
        }
      )
        .bindTooltip(text, {
          permanent: Boolean(onSelectRider),
          direction: "top",
          offset: [0, -8],
        })
        .on("click", () => {
          onSelectRider?.(rider.id);
        })
        .addTo(layer);
    }

    if (riders.length && !centeredRef.current) {
      map.fitBounds(
        L.latLngBounds(
          riders.map((rider) => [
            rider.latitude,
            rider.longitude,
          ])
        ),
        {
          padding: [35, 35],
          maxZoom: 15,
        }
      );

      centeredRef.current = true;
    }
  }, [result, now, endpoint, selectedRiderId, onSelectRider]);

  useEffect(() => {
    if (!mapRef.current || !selectedRiderId) return;

    const selected = result?.riders?.find((rider) => rider.id === selectedRiderId);
    if (!selected) return;

    const age = Date.now() - new Date(selected.capturedAt).getTime();
    if (!Number.isFinite(selected.latitude) || !Number.isFinite(selected.longitude) || !Number.isFinite(age) || age > 120000) return;

    mapRef.current.setView([selected.latitude, selected.longitude], Math.max(mapRef.current.getZoom(), 14));
  }, [selectedRiderId, result]);

  function centerRiders() {
    if (!riders.length || !mapRef.current) return;

    mapRef.current.fitBounds(
      L.latLngBounds(
        riders.map((rider) => [
          rider.latitude,
          rider.longitude,
        ])
      ),
      {
        padding: [35, 35],
        maxZoom: 15,
      }
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          GPS updates approximately every 10 seconds
        </p>

        <button
          type="button"
          onClick={centerRiders}
          disabled={!riders.length}
          className="text-sm font-medium text-orange-700 disabled:opacity-40"
        >
          Center map
        </button>
      </div>

      <div
        ref={elementRef}
        aria-label="Rider location map"
        className="isolate w-full rounded-2xl"
        style={{
          height,
          maxHeight: "70vh",
          minHeight: 320,
        }}
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!error && riders.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          {!endpoint
            ? "Select a parcel to see rider tracking."
            : !result
            ? "Loading location..."
            : result.message || "No recent GPS location available."}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {showRiderList && riders.map((rider) => {
          const seconds = Math.max(
            0,
            Math.floor(
              (now - new Date(rider.capturedAt).getTime()) / 1000
            )
          );

          return (
            <div key={rider.id} className="text-sm">
              <span className="font-semibold">
                {rider.name}
              </span>
              {" · "}
              <span
                className={
                  seconds > 30
                    ? "text-gray-500"
                    : "text-green-700"
                }
              >
                {seconds > 30 ? "Outdated" : "Recent GPS"}
              </span>

              <p className="text-xs text-gray-500">
                Updated {seconds}s ago
                {Number.isFinite(rider.accuracy)
                  ? ` · Accuracy approximately ${Math.round(
                      rider.accuracy
                    )} m`
                  : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}