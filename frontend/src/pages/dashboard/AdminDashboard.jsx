import Navbar from "../../components/home/Navbar";

function AdminDashboard() {
  return (
    <>
      <Navbar />
        <div className="min-h-screen bg-orange-50 p-8"></div>
        <div className="min-h-screen bg-orange-50 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-3 text-gray-600">Manage fleet, riders, parcels and analytics.</p>

            <div className="grid md:grid-cols-4 gap-5 mt-10">
              <Card title="Total Riders" value="120" />
              <Card title="Active Deliveries" value="85" />
              <Card title="Completed" value="540" />
              <Card title="Revenue" value="$12K" />
            </div>
          </div>
        </div>
    </>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}


export default AdminDashboard;
