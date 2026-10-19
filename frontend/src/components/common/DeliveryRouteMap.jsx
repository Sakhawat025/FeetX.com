import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { getTracking } from "../../services/trackingApi";

export default function DeliveryRouteMap({ deliveryId }) {
  const elementRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const centeredRef = useRef(false);
  const boundsRef = useRef([]);

  const [data, setData] = useState(null);
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

    mapRef.current = map;
    layersRef.current = L.layerGroup().addTo(map);

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer;

    setData(null);
    setError("");
    centeredRef.current = false;
    boundsRef.current = [];
    layersRef.current?.clearLayers();

    if (!deliveryId) return;

    async function load() {
      try {
        const result = await getTracking(
          `/tracking/journey/${deliveryId}`
        );

        if (!result?.delivery?.id) {
          throw new Error("Invalid tracking response");
        }

        if (active) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (active) {
          setData(null);
          setError(
            err.response?.data?.message ||
              "Unable to refresh tracking. Retrying..."
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
  }, [deliveryId]);

  const current =
    String(data?.delivery?.id) === String(deliveryId)
      ? data
      : null;

  const age = current?.rider
    ? now - new Date(current.rider.capturedAt).getTime()
    : Infinity;

  const riderVisible = age >= -10000 && age <= 120000;
  const riderDelayed = age > 30000;

  // Hide a live route when its rider location has expired.
  const routeVisible =
    current?.route &&
    (current.mode === "preview" || riderVisible);

  useEffect(() => {
    const layer = layersRef.current;
    const map = mapRef.current;

    if (!layer || !map) return;

    layer.clearLayers();
    boundsRef.current = [];

    if (!current) return;

    const points = [];

    function addMarker(point, color, label) {
      if (
        !point ||
        !Number.isFinite(point.latitude) ||
        !Number.isFinite(point.longitude)
      ) {
        return;
      }

      const position = [point.latitude, point.longitude];
      points.push(position);

      const text = document.createElement("span");
      text.textContent = label;

      L.circleMarker(position, {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      })
        .bindTooltip(text, {
          permanent: true,
          direction: "top",
        })
        .addTo(layer);
    }

    if (routeVisible) {
      const line = current.route.coordinates.map(
        ([longitude, latitude]) => [latitude, longitude]
      );

      L.polyline(line, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.85,
      }).addTo(layer);

      points.push(...line);
    }

    addMarker(current.pickup, "#16a34a", "Pickup");
    addMarker(current.destination, "#ea580c", "Delivery");

    if (riderVisible) {
      addMarker(
        current.rider,
        riderDelayed ? "#6b7280" : "#7c3aed",
        `${current.rider.name} — ${
          riderDelayed ? "location delayed" : "Rider"
        }`
      );
    }

    boundsRef.current = points;

    if (points.length && !centeredRef.current) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [45, 45],
        maxZoom: 16,
      });

      centeredRef.current = true;
    }
  }, [current, routeVisible, riderVisible, riderDelayed]);

  const centerMap = () => {
    if (!mapRef.current || !boundsRef.current.length) return;

    mapRef.current.fitBounds(
      L.latLngBounds(boundsRef.current),
      {
        padding: [45, 45],
        maxZoom: 16,
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">
          Delivery route
        </h3>

        <button
          type="button"
          onClick={centerMap}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Center map
        </button>
      </div>

      <div
        ref={elementRef}
        className="relative z-0 h-96 w-full rounded-xl"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!deliveryId && (
        <p className="text-sm text-gray-500">
          Select a parcel to view its route.
        </p>
      )}

      {deliveryId && !current && !error && (
        <p className="text-sm text-gray-500">
          Loading route...
        </p>
      )}

      {current && (
        <div className="space-y-2 text-sm">
          <p className="font-medium">
            {current.delivery.trackingId}
            {" · "}
            {current.delivery.status.replaceAll("_", " ")}
          </p>

          <p>{current.label}</p>

          {routeVisible && (
            <p className="text-blue-700">
              Suggested route:{" "}
              {(current.route.distanceMeters / 1000).toFixed(1)}
              {" km · Estimated driving time: "}
              {Math.max(
                1,
                Math.round(current.route.durationSeconds / 60)
              )}
              {" min"}
            </p>
          )}

          {current.routeMessage && (
            <p className="text-amber-700">
              {current.routeMessage}
            </p>
          )}

          {riderVisible ? (
            <p className="text-gray-600">
              {current.rider.name} · Updated{" "}
              {Math.max(0, Math.floor(age / 1000))} seconds ago
              {riderDelayed ? " · Location update delayed" : ""}
            </p>
          ) : current.mode !== "ended" ? (
            <p className="text-gray-600">
              Waiting for a fresh rider location.
            </p>
          ) : null}

          <p className="text-gray-600">
            Pickup: {current.delivery.pickupAddress}
          </p>

          <p className="text-gray-600">
            Delivery: {current.delivery.deliveryAddress}
          </p>

          <p className="text-xs text-gray-500">
            Blue: suggested road route · Green: pickup ·
            Orange: delivery · Purple: rider.
            Driving time excludes live traffic and delivery stops.
          </p>
        </div>
      )}
    </div>
  );
}