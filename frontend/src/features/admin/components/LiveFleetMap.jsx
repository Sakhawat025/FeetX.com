import LiveLocationMap from "../../../components/common/LiveLocationMap";

export default function LiveFleetMap() {
  return (
    <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Live Fleet Map
      </h2>

      <LiveLocationMap endpoint="/tracking/fleet" />
    </section>
  );
}