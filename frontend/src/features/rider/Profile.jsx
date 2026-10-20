import { useEffect, useState } from "react";
import { getRiderProfile, updateRiderProfile } from "../../services/riderApi";
import { useAuth } from "../../context/AuthContext";

const fields = [
  ["name", "Full Name", "text", 100],
  ["email", "Email", "email", 254],
  ["phone", "Phone", "tel", 25],
  ["vehicleName", "Vehicle", "text", 100],
  ["plateNumber", "Plate Number", "text", 40],
  ["vehicleId", "Vehicle ID", "text", 40],
  ["zone", "Zone", "text", 100],
];

const card = "rounded-3xl bg-white p-6 shadow-sm";

export default function RiderProfile() {
  const { updateUser } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    getRiderProfile()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || "Could not load profile.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  function edit() {
    setForm(Object.fromEntries(fields.map(([key]) => [key, data.profile[key] || ""])));
    setError("");
    setNotice("");
    setEditing(true);
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const profile = await updateRiderProfile(form);
      setData((previous) => ({ ...previous, profile }));
      updateUser(profile);
      setEditing(false);
      setNotice("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading profile...</p>;

  if (!data) {
    return <p role="alert" className="text-red-600">{error}</p>;
  }

  const { profile, stats, feedback } = data;
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  return (
    <div className="space-y-5 text-[#42210f]">
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {notice && <p role="status" className="text-green-700">{notice}</p>}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={card}>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#42210f] text-3xl font-bold text-white">
            {initials}
          </div>

          <h2 className="mt-5 text-center text-xl font-bold">{profile.name}</h2>

          <p className="mt-2 text-center text-orange-600">
            {stats.rating == null ? "No ratings yet" : `★ ${stats.rating.toFixed(1)} · ${stats.reviewCount} reviews`}
          </p>

          <div className="mt-6 space-y-2 break-words text-sm text-gray-500">
            <p>{profile.email}</p>
            <p>{profile.phone || "Phone not added"}</p>
          </div>

          <button
            type="button"
            onClick={edit}
            disabled={editing}
            className="mt-6 w-full rounded-2xl border border-orange-500 px-4 py-3 font-medium text-orange-600 disabled:opacity-50"
          >
            Edit Profile
          </button>
        </section>

        <div className="space-y-6 xl:col-span-2">
          <section className={card}>
            <h2 className="text-lg font-semibold">Vehicle Details</h2>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {fields.slice(3).map(([key, label]) => (
                <div key={key}>
                  <dt className="text-sm text-gray-400">{label}</dt>
                  <dd className="break-words font-medium">{profile[key] || "Not added"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Total Deliveries", stats.totalDeliveries],
              ["On-Time Rate", stats.onTimeRate == null ? "N/A" : `${stats.onTimeRate}%`],
              ["This Month", stats.thisMonth],
            ].map(([label, value]) => (
              <div key={label} className={`${card} text-center`}>
                <p className="text-3xl font-bold">{value}</p>
                <p className="mt-2 text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            Completed deliveries only. This month uses Bangladesh time.
            On-time rate uses {stats.timedDeliveryCount} deliveries with recorded deadlines and completion times.
          </p>

          <section className={card}>
            <h2 className="text-lg font-semibold">Recent Feedback</h2>

            {!feedback.length ? (
              <p className="mt-4 text-sm text-gray-500">No customer feedback yet.</p>
            ) : (
              feedback.map((item) => (
                <article key={item.id} className="border-b border-orange-100 py-4 last:border-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">{item.customer.name}</p>
                    <span className="text-orange-600" aria-label={`${item.rating} out of 5 stars`}>
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm text-gray-500">
                    {item.feedback || "Rating submitted without a comment."}
                  </p>
                </article>
              ))
            )}
          </section>
        </div>
      </div>

      {editing && (
        <form onSubmit={save} className={card}>
          <h2 className="mb-5 text-lg font-semibold">Edit Profile</h2>

          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            {fields.map(([key, label, type, maxLength]) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <input
                  type={type}
                  maxLength={maxLength}
                  required={key === "name" || key === "email"}
                  value={form[key]}
                  onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))}
                  className="mt-2 block w-full rounded-xl border border-orange-200 p-3"
                />
              </label>
            ))}
          </fieldset>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#42210f] px-5 py-3 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError("");
              }}
              className="rounded-xl border px-5 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
