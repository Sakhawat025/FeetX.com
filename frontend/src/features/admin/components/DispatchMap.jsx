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

export default function DispatchMap({ parcel, riders }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const fittedParcel = useRef(null);

  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const map = L.map(containerRef.current).setView([23.8103, 90.4125], 11);
    mapRef.current = map;

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    const onTileError = () => setTileError(true);
    tiles.on("tileerror", onTileError);

    markersRef.current = L.layerGroup().addTo(map);

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      tiles.off("tileerror", onTileError);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      fittedParcel.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    const points = [];

    function addPoint(latitude, longitude, label, color) {
      if (!validPoint(latitude, longitude)) return;

      const point = [latitude, longitude];

      // Text nodes prevent names being interpreted as HTML.
      const tooltip = document.createElement("span");
      tooltip.textContent = label;

      L.circleMarker(point, {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      })
        .bindTooltip(tooltip, {
          permanent: true,
          direction: "bottom",
          offset: [0, 8],
        })
        .addTo(layer);

      points.push(point);
    }

    if (parcel) {
      addPoint(
        parcel.pickupLatitude,
        parcel.pickupLongitude,
        "Pickup Point",
        "#059669"
      );
    }

    for (const rider of riders) {
      addPoint(
        rider.location.latitude,
        rider.location.longitude,
        rider.name,
        "#ea580c"
      );
    }

    // Preserve user's zoom during background refreshes.
    if (points.length && fittedParcel.current !== parcel?.id) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [45, 45],
        maxZoom: 14,
      });

      fittedParcel.current = parcel?.id;
    }
  }, [parcel, riders]);

  return (
    <div>
      <div
        ref={containerRef}
        aria-label="Pickup point and eligible rider locations"
        className="relative z-0 h-[340px] w-full rounded-2xl"
      />

      {tileError && (
        <p role="status" className="mt-2 text-xs text-amber-700">
          Map tiles could not load. Check the internet connection.
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Green: pickup · Orange: eligible riders · Distances are
        straight-line estimates, not driving routes.
      </p>
    </div>
  );
}