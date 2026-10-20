import { useState } from "react";
import api from "../../services/api";

export default function DeliveryFeedback({ delivery, onSaved }) {
  const [rating, setRating] = useState(delivery.rating || 5);
  const [feedback, setFeedback] = useState(delivery.feedback || "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (delivery.status !== "DELIVERED" || !delivery.riderId) {
    return null;
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      await api.put(`/deliveries/${delivery.id}/feedback`, {
        rating: Number(rating),
        feedback,
      });

      onSaved({
        ...delivery,
        rating: Number(rating),
        feedback: feedback.trim(),
      });

      setOpen(false);
      setMessage("Feedback saved.");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Could not save feedback."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 min-w-48">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setMessage("");
        }}
        className="text-sm font-medium text-orange-600"
      >
        {delivery.rating ? "Edit Feedback" : "Rate Delivery"}
      </button>

      {message && (
        <p role="status" className="mt-2 text-sm">
          {message}
        </p>
      )}

      {open && (
        <form onSubmit={save} className="mt-3 space-y-3">
          <label className="block text-sm">
            Rating
            <select
              value={rating}
              disabled={busy}
              onChange={(event) => setRating(Number(event.target.value))}
              className="mt-1 block w-full rounded-lg border p-2"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} stars
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Feedback
            <textarea
              maxLength={1000}
              disabled={busy}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="mt-1 block w-full rounded-lg border p-2"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white"
          >
            {busy ? "Saving..." : "Submit Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}