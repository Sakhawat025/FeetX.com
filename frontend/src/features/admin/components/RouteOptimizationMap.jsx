import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function validPoint(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

const COLORS = {
  start: "#059669",
  delivery: "#dc2626",
  route: "#ea580c",
};

export default function RouteOptimizationMap({ sequence, riderName }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedRef = useRef(null);

  const [tileError, setTileError] = useState(false);

  // Initialize map
  useEffect(() => {
    const map = L.map(containerRef.current).setView([23.8103, 90.4125], 11);
    mapRef.current = map;

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }
    ).addTo(map);

    const onTileError = () => setTileError(true);
    tiles.on("tileerror", onTileError);

    layerRef.current = L.layerGroup().addTo(map);

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      tiles.off("tileerror", onTileError);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      fittedRef.current = null;
    };
  }, []);

  // Update markers and route line
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    if (!sequence || sequence.length === 0) return;

    const points = [];
    const routeLatLngs = [];

    for (let i = 0; i < sequence.length; i++) {
      const stop = sequence[i];

      if (!validPoint(stop.latitude, stop.longitude)) continue;

      const point = [stop.latitude, stop.longitude];
      const isStart = stop.type === "start";
      const color = isStart ? COLORS.start : COLORS.delivery;

      // Numbered marker using DivIcon
      const iconHtml = isStart
        ? `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:3px solid #fff;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:bold;font-size:13px;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">✓</div>`
        : `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:3px solid #fff;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:bold;font-size:13px;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">${stop.order}</div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Tooltip label
      const tooltipEl = document.createElement("span");
      const shortLabel = stop.trackingId
        ? `#${stop.trackingId}`
        : stop.label;
      tooltipEl.textContent = shortLabel;

      L.marker(point, { icon })
        .bindTooltip(tooltipEl, {
          permanent: true,
          direction: "top",
          offset: [0, -18],
          className: "route-opt-tooltip",
        })
        .addTo(layer);

      points.push(point);
      routeLatLngs.push(point);
    }

    // Draw the route line
    if (routeLatLngs.length >= 2) {
      L.polyline(routeLatLngs, {
        color: COLORS.route,
        weight: 4,
        opacity: 0.85,
        dashArray: null,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);
    }

    // Fit bounds only on first load or rider change
    const key = sequence.map((s) => s.order).join(",");

    if (points.length && fittedRef.current !== key) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [50, 50],
        maxZoom: 14,
      });

      fittedRef.current = key;
    }
  }, [sequence]);

  return (
    <div className="relative">
      {riderName && (
        <div className="absolute right-3 top-3 z-[500] rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm">
          {riderName}
        </div>
      )}

      <div
        ref={containerRef}
        aria-label="Optimized delivery route map"
        className="relative z-0 h-[420px] w-full rounded-2xl"
      />

      {tileError && (
        <p role="status" className="mt-2 text-xs text-amber-700">
          Map tiles could not load. Check the internet connection.
        </p>
      )}
    </div>
  );
}

