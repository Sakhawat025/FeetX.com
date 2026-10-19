import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function ParcelLocationPicker({
  pickup,
  destination,
  onChange,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const callbackRef = useRef(onChange);
  const modeRef = useRef("pickup");

  const [mode, setMode] = useState("pickup");

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    }).setView([23.8103, 90.4125], 11);

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

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    map.on("click", ({ latlng }) => {
      callbackRef.current(modeRef.current, {
        latitude: latlng.lat,
        longitude: latlng.wrap().lng,
      });
    });

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;

    layer.clearLayers();

    const addPoint = (point, color, label) => {
      if (
        !point ||
        !Number.isFinite(point.latitude) ||
        !Number.isFinite(point.longitude)
      ) {
        return;
      }

      L.circleMarker(
        [point.latitude, point.longitude],
        {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
        }
      )
        .bindTooltip(label, {
          permanent: true,
          direction: "top",
        })
        .addTo(layer);
    };

    addPoint(pickup, "#16a34a", "Pickup");
    addPoint(destination, "#ea580c", "Delivery");
  }, [pickup, destination]);

  const changeMode = (nextMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
  };

  const showSelectedPoints = () => {
    const points = [pickup, destination]
      .filter(
        (point) =>
          point &&
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude)
      )
      .map((point) => [point.latitude, point.longitude]);

    if (!points.length || !mapRef.current) return;

    mapRef.current.fitBounds(L.latLngBounds(points), {
      padding: [40, 40],
      maxZoom: 16,
    });
  };

  const formatPoint = (point) => {
    if (
      !point ||
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude)
    ) {
      return "Not selected";
    }

    return (
      `${point.latitude.toFixed(6)}, ` +
      point.longitude.toFixed(6)
    );
  };

  return (
    <div className="rounded-xl border border-orange-200 p-4">
      <h3 className="font-semibold text-gray-900">
        Select pickup and delivery points *
      </h3>

      <p className="mt-1 text-sm text-gray-600">
        Choose a button, then click the exact location on the map.
        Use + / − to zoom and drag to move.
      </p>

      <div className="my-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={mode === "pickup"}
          onClick={() => changeMode("pickup")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "pickup"
              ? "bg-green-600 text-white"
              : "bg-green-50 text-green-700"
          }`}
        >
          1. Select Pickup
        </button>

        <button
          type="button"
          aria-pressed={mode === "delivery"}
          onClick={() => changeMode("delivery")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "delivery"
              ? "bg-orange-600 text-white"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          2. Select Delivery
        </button>

        <button
          type="button"
          onClick={showSelectedPoints}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Show selected points
        </button>
      </div>

      <p className="mb-2 text-sm font-medium">
        Selecting: {mode === "pickup" ? "Pickup" : "Delivery"}
      </p>

      <div
        ref={containerRef}
        className="relative z-0 h-80 w-full rounded-lg"
      />

      <div className="mt-3 space-y-1 text-sm">
        <p className="text-green-700">
          Pickup: {formatPoint(pickup)}
        </p>
        <p className="text-orange-700">
          Delivery: {formatPoint(destination)}
        </p>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Keep the written addresses consistent with the selected points.
      </p>
    </div>
  );
}