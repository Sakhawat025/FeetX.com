import { MapPinned, Route, Truck, PackageSearch } from "lucide-react";
import { motion } from "framer-motion";

function Features() {
  const features = [
    {
      icon: MapPinned,
      title: "Real-Time Fleet Monitoring",
      description: "Monitor riders, vehicles and delivery activities through a live operational dashboard."
    },
    {
      icon: Route,
      title: "Smart Route Optimization",
      description: "Generate efficient routes by analyzing distance, locations and multiple delivery stops."
    },
    {
      icon: Truck,
      title: "Intelligent Dispatching",
      description: "Automatically recommend suitable riders based on location, workload and availability."
    },
    {
      icon: PackageSearch,
      title: "Customer Tracking",
      description: "Provide customers with live parcel tracking, ETA and delivery progress updates."
    }
  ];

  return (
    <section id="features" className="bg-orange-50 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
            Platform Features
          </span>
          <h2 className="mt-5 text-4xl lg:text-5xl font-extrabold text-gray-950">
            Everything You Need To Run
            <span className="text-orange-700"> Smart Logistics</span>
          </h2>
          <p className="mt-5 text-gray-600">
            Manage deliveries, optimize routes and improve operational efficiency with one intelligent platform.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group bg-white rounded-2xl p-7 border border-orange-100 hover:shadow-xl transition duration-300"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 group-hover:bg-orange-700 group-hover:text-white transition duration-300">
                  <Icon size={28} />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-950">{feature.title}</h3>
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
