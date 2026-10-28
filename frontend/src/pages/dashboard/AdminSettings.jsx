import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Save,
  RefreshCw,
  LogOut,
} from "lucide-react";

import AdminLayout from "../../features/admin/components/AdminLayout";
import { useAuth } from "../../context/AuthContext";

import {
  getAdminSettings,
  saveAdminSettings,
} from "../../services/settingsApi";

const fields = [
  "maxActiveParcels",
  "autoAssignmentRadiusKm",
  "priorityDeliveryBufferMin",
  "companyName",
  "supportEmail",
  "operatingCity",
];

function toForm(settings) {
  return Object.fromEntries(
    fields.map((key) => [
      key,
      String(settings[key]),
    ])
  );
}

const inputClass =
  "rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm text-[#42210f] outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-60";

export default function AdminSettings() {
  const { user, logout } = useAuth();

  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0);

  const saveAbort = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      saveAbort.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setSuccess("");

    getAdminSettings(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setSaved(result);
          setForm(toForm(result));
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.message ||
              "Could not load settings. Please retry."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reload]);

  const dirty =
    !!saved &&
    JSON.stringify(form) !==
      JSON.stringify(toForm(saved));

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      warn
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        warn
      );
    };
  }, [dirty]);

  function change(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSuccess("");
  }

  async function submit(event) {
    event.preventDefault();

    if (!dirty || saving) {
      return;
    }

    const controller = new AbortController();
    saveAbort.current = controller;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveAdminSettings(
        {
          ...form,

          version: saved.version,

          maxActiveParcels: Number(
            form.maxActiveParcels
          ),

          autoAssignmentRadiusKm: Number(
            form.autoAssignmentRadiusKm
          ),

          priorityDeliveryBufferMin: Number(
            form.priorityDeliveryBufferMin
          ),
        },
        controller.signal
      );

      if (!mounted.current) {
        return;
      }

      setSaved(result);
      setForm(toForm(result));

      setSuccess(
        "Settings saved. New dispatch assignments will use these rules."
      );
    } catch (err) {
      if (
        mounted.current &&
        !controller.signal.aborted
      ) {
        setError(
          err.response?.data?.message ||
            "Save could not be confirmed. Reload settings to check before retrying."
        );
      }
    } finally {
      if (mounted.current) {
        setSaving(false);
      }
    }
  }

  return (
    <AdminLayout>
      <section className="min-h-screen bg-[#fff4e8] p-5 text-[#42210f] sm:p-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/admin/dashboard"
              className="mb-3 block text-sm text-orange-700 lg:hidden"
            >
              ← Dashboard
            </Link>

            <p className="text-sm text-slate-500">
              Operations
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Settings 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Configure platform-wide operational settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#42210f] font-bold text-white">
              {(user?.name || "A")
                .charAt(0)
                .toUpperCase()}
            </span>

            <span className="text-sm">
              {user?.name || "Admin"}
            </span>

            <button
              type="button"
              onClick={logout}
              aria-label="Logout"
              className="rounded-xl border border-orange-200 p-2"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="max-w-[690px]">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}

              <button
                type="button"
                disabled={saving || loading}
                onClick={() =>
                  setReload((value) => value + 1)
                }
                className="ml-2 underline disabled:opacity-50"
              >
                Reload saved settings
              </button>
            </div>
          )}

          {success && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              {success}
            </p>
          )}

          {loading ? (
            <p
              role="status"
              className="rounded-2xl bg-white p-6"
            >
              Loading settings…
            </p>
          ) : (
            form && (
              <form onSubmit={submit}>
                <fieldset
                  disabled={saving}
                  className="space-y-6"
                >
                  <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-bold">
                      Dispatch Rules
                    </h2>

                    <div className="space-y-4">
                      {[
                        [
                          "maxActiveParcels",
                          "Max active parcels per rider",
                          1,
                          100,
                          1,
                        ],
                        [
                          "autoAssignmentRadiusKm",
                          "Auto-assignment radius (km)",
                          0.1,
                          100,
                          0.1,
                        ],
                        [
                          "priorityDeliveryBufferMin",
                          "Priority delivery buffer (min)",
                          0,
                          1440,
                          1,
                        ],
                      ].map(
                        ([
                          key,
                          label,
                          min,
                          max,
                          step,
                        ]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span>{label}</span>

                            <input
                              name={key}
                              aria-label={label}
                              type="number"
                              required
                              min={min}
                              max={max}
                              step={step}
                              value={form[key]}
                              onChange={(event) =>
                                change(
                                  key,
                                  event.target.value
                                )
                              }
                              className={`${inputClass} w-28 shrink-0 text-right`}
                            />
                          </label>
                        )
                      )}
                    </div>

                    <p className="mt-5 text-xs leading-5 text-slate-500">
                      Parcel limit and pickup radius apply
                      to Smart Dispatch recommendations and
                      assignments. Radius uses straight-line
                      GPS distance. Express deadlines are
                      this buffer earlier than the normal
                      SLA, with a minimum of 1 minute.
                      Existing assignments and deadlines
                      remain unchanged.
                    </p>
                  </section>

                  <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-bold">
                      Organization Details
                    </h2>

                    <div className="space-y-5">
                      {[
                        [
                          "companyName",
                          "Company Name",
                          "text",
                          100,
                          "FleetX Logistics",
                        ],
                        [
                          "supportEmail",
                          "Support Email",
                          "email",
                          254,
                          "Your support email",
                        ],
                        [
                          "operatingCity",
                          "Operating City",
                          "text",
                          120,
                          "Dhaka, Bangladesh",
                        ],
                      ].map(
                        ([
                          key,
                          label,
                          type,
                          maxLength,
                          placeholder,
                        ]) => (
                          <label
                            key={key}
                            className="block text-sm text-slate-500"
                          >
                            {label}

                            <input
                              name={key}
                              type={type}
                              required
                              maxLength={maxLength}
                              placeholder={placeholder}
                              value={form[key]}
                              onChange={(event) =>
                                change(
                                  key,
                                  event.target.value
                                )
                              }
                              className={`${inputClass} mt-2 w-full`}
                            />
                          </label>
                        )
                      )}
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                      Used in the Admin sidebar and Contact
                      Support link. Operating city is a
                      display label, not a delivery geofence.
                    </p>
                  </section>
                </fieldset>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {dirty
                      ? "You have unsaved changes."
                      : saved.updatedAt
                        ? `Last saved: ${new Date(
                            saved.updatedAt
                          ).toLocaleString("en-GB", {
                            timeZone: "Asia/Dhaka",
                          })} (Dhaka)`
                        : "Default settings. Enter your support email and save."}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!dirty || saving}
                      onClick={() => {
                        setForm(toForm(saved));
                        setError("");
                        setSuccess("");
                      }}
                      className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm disabled:opacity-40"
                    >
                      Discard edits
                    </button>

                    <button
                      type="submit"
                      disabled={!dirty || saving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#42210f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      {saving ? (
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}

                      {saving
                        ? "Saving…"
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            )
          )}
        </div>
      </section>
    </AdminLayout>
  );
}