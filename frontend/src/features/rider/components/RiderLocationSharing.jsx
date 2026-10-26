import { useEffect, useState } from "react";
import {
  startLocationSession,
  stopLocationSession,
  sendRiderLocation,
} from "../../../services/trackingApi";

function getPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      }
    );
  });
}

export default function RiderLocationSharing() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("Location sharing is off.");
  const [lastSent, setLastSent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let sessionId = null;
    let timer;
    let sending = false;

    async function sendPosition(firstPosition) {
      if (cancelled || sending) return;

      sending = true;

      try {
        const position = firstPosition || await getPosition();

        if (cancelled) return;

        await sendRiderLocation({
          sessionId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: position.timestamp,
        });

        if (!cancelled) {
          setError("");
          setLastSent(new Date(position.timestamp));
          setMessage("Location sharing is on.");
        }
      } catch (err) {
        if (cancelled) return;

        const status = err.response?.status;

        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to get or send location."
        );

        if (
          err.code === 1 ||
          [401, 403, 409].includes(status)
        ) {
          setEnabled(false);
          setMessage("Location sharing stopped.");
        } else {
          setMessage("Location update failed. Retrying...");
        }
      } finally {
        sending = false;
      }
    }

    async function begin() {
      try {
        setError("");
        setLastSent(null);
        setMessage("Requesting GPS permission...");

        const firstPosition = await getPosition();

        if (cancelled) return;

        const result = await startLocationSession();
        sessionId = result.sessionId;

        if (cancelled) {
          await stopLocationSession(sessionId);
          return;
        }

        await sendPosition(firstPosition);

        if (!cancelled) {
          timer = window.setInterval(() => {
            sendPosition();
          }, 10000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Could not start location sharing."
          );
          setEnabled(false);
          setMessage("Location sharing is off.");
        }
      }
    }

    begin();

    return () => {
      cancelled = true;
      window.clearInterval(timer);

      if (sessionId) {
        stopLocationSession(sessionId).catch(() => {});
      }
    };
  }, [enabled]);

  function start() {
    if (!window.isSecureContext) {
      setError("Open this site using HTTPS to share location.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Your browser does not support location sharing.");
      return;
    }

    setEnabled(true);
  }

  function stop() {
    setEnabled(false);
    setMessage("Location sharing is off.");
  }

  return (
    <section className="mb-5 rounded-2xl border border-orange-100 bg-white p-5">
      <h2 className="font-bold text-[#4b2100]">
        GPS Location Sharing
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        While sharing is enabled, Admin can use your live location for
        delivery assignments. Customers can see your location only for
        their active assigned parcels. Keep this page open while on duty.
      </p>

      <p className="mt-3 text-sm font-medium">
        {message}
      </p>

      {enabled && lastSent && (
        <p className="mt-1 text-xs text-gray-500">
          Last GPS sample sent: {lastSent.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={enabled ? stop : start}
        className={`mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white ${
          enabled ? "bg-red-600" : "bg-orange-600"
        }`}
      >
        {enabled ? "Stop Sharing" : "Start Sharing"}
      </button>
    </section>
  );
}