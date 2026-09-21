import { MapPin, Route, PackageCheck, Users } from "lucide-react";
import { motion } from "framer-motion";

function Hero() {
  const stats = [
    { icon: Users, value: "500+", label: "Active Riders" },
    { icon: PackageCheck, value: "10K+", label: "Deliveries" },
    { icon: Route, value: "99%", label: "Route Accuracy" }
  ];

  return (
    <section id="home" className="bg-orange-50 px-6 py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
            <MapPin size={16} />
            Smart Fleet Management Platform
          </div>

          <h1 className="mt-6 text-5xl lg:text-6xl font-extrabold leading-[1.1] text-gray-950">
            Optimize Delivery.<br />
            <span className="text-orange-700">Control Your Fleet.</span><br />
            In Real Time.
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
            FeetX helps logistics companies manage riders, optimize delivery routes and monitor fleet operations
            through an intelligent real-time platform.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <motion.button
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="px-7 py-3 rounded-xl bg-orange-700 text-white font-semibold hover:bg-orange-800 transition shadow-lg"
            >
              Start Managing Fleet
            </motion.button>

            <motion.button
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="px-7 py-3 rounded-xl border border-orange-700 text-orange-700 font-semibold hover:bg-orange-100 transition"
            >
              View Demo
            </motion.button>
          </div>

          {/* Mini Stats */}
          <div className="mt-10 flex flex-wrap gap-6">
            {stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-white shadow flex items-center justify-center text-orange-700">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.value}</h4>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-3xl shadow-2xl border border-orange-100 p-6 relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xl">Fleet Overview</h3>
              <p className="text-sm text-gray-500">Live operational status</p>
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              ● Live
            </div>
          </div>

          {/* Map */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="mt-6 h-72 bg-slate-100 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-20 left-20 w-4 h-4 rounded-full bg-green-600"></div>
            <div className="absolute bottom-20 right-24 w-4 h-4 rounded-full bg-orange-600"></div>
            <div className="absolute top-32 left-24 w-52 border-t-2 border-dashed border-orange-500 rotate-12"></div>
            <div className="absolute bottom-10 left-10 bg-white rounded-xl shadow px-4 py-3">
              <p className="text-xs text-gray-500">Current Delivery</p>
              <p className="font-bold">Rider #1024</p>
            </div>
          </motion.div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Riders</p>
              <h4 className="font-bold text-xl">128</h4>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Active</p>
              <h4 className="font-bold text-xl">96</h4>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Delivered</p>
              <h4 className="font-bold text-xl">540</h4>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
