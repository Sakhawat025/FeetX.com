import { MapPin, Truck, PackageCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

function DashboardPreview() {
  const deliveries = [
    { id: "#1024", rider: "Alex Rider", status: "On Route", color: "text-blue-600" },
    { id: "#1025", rider: "John Smith", status: "Delivered", color: "text-green-600" },
    { id: "#1026", rider: "Michael Lee", status: "Preparing", color: "text-orange-600" }
  ];

  return (
    <section id="solutions" className="bg-orange-50 py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold">
            Fleet Intelligence
          </span>

          <h2 className="mt-5 text-4xl lg:text-5xl font-extrabold text-gray-950 leading-tight">
            Complete Control Over Your Delivery Network
          </h2>

          <p className="mt-5 text-gray-600 leading-relaxed">
            Monitor every rider, track every delivery and analyze operational performance from one powerful dashboard.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-700 text-white flex items-center justify-center">
                <MapPin size={22} />
              </div>
              <div>
                <h4 className="font-bold">Real-Time Tracking</h4>
                <p className="text-sm text-gray-600">View rider locations instantly.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-700 text-white flex items-center justify-center">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="font-bold">Smart Fleet Management</h4>
                <p className="text-sm text-gray-600">Manage riders and vehicles efficiently.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-700 text-white flex items-center justify-center">
                <BarChart3 size={22} />
              </div>
              <div>
                <h4 className="font-bold">Delivery Analytics</h4>
                <p className="text-sm text-gray-600">Improve decisions with operational data.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b">
            <div>
              <h3 className="font-bold text-xl">Fleet Dashboard</h3>
              <p className="text-xs text-gray-500">Live Operations</p>
            </div>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              ● Online
            </span>
          </div>

          <div className="grid md:grid-cols-3">
            {/* Sidebar */}
            <div className="hidden md:block bg-gray-950 text-white p-5">
              <p className="text-xs text-gray-400">Navigation</p>
              <ul className="mt-6 space-y-5 text-sm">
                <li>Dashboard</li>
                <li>Riders</li>
                <li>Parcels</li>
                <li>Analytics</li>
              </ul>
            </div>

            {/* Main Dashboard */}
            <div className="md:col-span-2 p-5">
              {/* Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Riders</p>
                  <h4 className="font-bold text-xl">128</h4>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Active</p>
                  <h4 className="font-bold text-xl">96</h4>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Completed</p>
                  <h4 className="font-bold text-xl">540</h4>
                </div>
              </div>

              {/* Map */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="mt-5 h-44 bg-slate-100 rounded-xl relative overflow-hidden"
              >
                <div className="absolute top-12 left-16 w-4 h-4 rounded-full bg-green-600" />
                <div className="absolute bottom-10 right-16 w-4 h-4 rounded-full bg-orange-600" />
              </motion.div>

              {/* Deliveries */}
              <div className="mt-5 space-y-3">
                {deliveries.map((item, index) => (
                  <div key={index} className="flex justify-between bg-gray-50 p-3 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm">Parcel {item.id}</p>
                      <p className="text-xs text-gray-500">{item.rider}</p>
                    </div>
                    <p className={`text-xs font-semibold ${item.color}`}>{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default DashboardPreview;
