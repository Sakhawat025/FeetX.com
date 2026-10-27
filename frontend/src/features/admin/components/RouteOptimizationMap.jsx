import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteOptimizationMap({
  manualRoute,
  optimizedRoute,
  mode = "both",
  riderName,
}) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);

  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const map = L.map(container.current).setView(
      [23.8103, 90.4125],
      11
    );

    mapRef.current = map;
    layersRef.current = L.featureGroup().addTo(map);

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }
    ).addTo(map);

    const onError = () => setTileError(true);

    tiles.on("tileerror", onError);

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container.current);

    return () => {
      observer.disconnect();
      tiles.off("tileerror", onError);
      map.remove();

      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layersRef.current;

    if (!map || !layer) {
      return;
    }

    layer.clearLayers();

    function draw(route, manual) {
      if (!route?.geometry) {
        return;
      }

      L.geoJSON(route.geometry, {
        style: {
          color: manual ? "#2563eb" : "#ea580c",
          weight: manual ? 8 : 4,
          opacity: manual ? 0.7 : 1,
          dashArray: manual ? "12 10" : undefined,
        },
      }).addTo(layer);
    }

    if (mode !== "optimized") {
      draw(manualRoute, true);
    }

    if (mode !== "manual") {
      draw(optimizedRoute, false);
    }

    const route =
      mode === "manual"
        ? manualRoute
        : optimizedRoute;

    for (const stop of route?.sequence || []) {
      const start = stop.type === "start";

      const color = start
        ? "#059669"
        : mode === "manual"
        ? "#2563eb"
        : "#ea580c";

      const label = document.createElement("div");

      label.textContent = start ? "S" : String(stop.order);

      Object.assign(label.style, {
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        background: color,
        color: "white",
        border: "2px solid white",
        display: "grid",
        placeItems: "center",
        fontWeight: "bold",
        boxShadow: "0 2px 6px #0005",
      });

      const tooltip = document.createElement("span");

      tooltip.textContent = `${
        start
          ? `${riderName} · GPS start`
          : `${stop.order}. ${stop.label}`
      } · ${stop.address}`;

      L.marker(
        [stop.latitude, stop.longitude],
        {
          icon: L.divIcon({
            html: label,
            className: "",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }
      )
        .bindTooltip(tooltip)
        .addTo(layer);
    }

    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 16,
      });
    }
  }, [
    manualRoute,
    optimizedRoute,
    mode,
    riderName,
  ]);

  return (
    <div>
      <div
        ref={container}
        aria-label="Manual and optimized road routes"
        className="relative z-0 h-[460px] w-full rounded-xl"
      />

      {tileError && (
        <p
          role="status"
          className="mt-2 text-xs text-amber-700"
        >
          Map tiles could not load. Check your internet
          connection.
        </p>
      )}
    </div>
  );
}