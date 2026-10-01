import Navbar from "../../components/home/Navbar";

function RiderDashboard() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-orange-50 p-8">
        <h1 className="text-4xl font-bold">Rider Dashboard</h1>
        <p className="mt-3 text-gray-600">View assigned deliveries and update delivery status.</p>
      </div>
    </>
  );
}

export default RiderDashboard;
