import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { updateProfile } from "../../services/authApi";

function Profile() {
  const { user, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");


  const handleEdit = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setMessage("");
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      await updateProfile({ name, phone });

      setMessage("Profile updated successfully.");
      setEditing(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3] flex">
        <main className="flex-1 p-8">
          <p className="text-gray-500">Loading profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] flex">
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-500">View and update your personal information.</p>
        <div className="mt-6 max-w-2xl rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              ) : (
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {user?.name || "Not available"}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {user?.email || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              {editing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              ) : (
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {user?.phone || "Not available"}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Account Type</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {user?.role || "CUSTOMER"}
              </p>
            </div>
          </div>
          {editing ? (
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="mt-6 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default Profile;
