import { FilePlus, UserCheck, Route, MapPinned, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

function HowItWorks() {
  const steps = [
    { icon: FilePlus, title: "Create Delivery", description: "Create parcel requests with pickup, destination and delivery details." },
    { icon: UserCheck, title: "Assign Rider", description: "Select the best rider based on location, availability and workload." },
    { icon: Route, title: "Optimize Route", description: "Generate efficient routes for faster and cost-effective delivery." },
    { icon: MapPinned, title: "Live Tracking", description: "Track rider movement and delivery progress in real time." },
    { icon: CheckCircle, title: "Complete Delivery", description: "Confirm delivery with status update and proof of delivery." }
  ];

  return (
    <section id="how-it-works" className="bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold">
            Workflow
          </span>
          <h2 className="mt-5 text-4xl lg:text-5xl font-extrabold text-gray-950">How FeetX Works</h2>
          <p className="mt-5 text-gray-600">
            A simple intelligent workflow from parcel creation to successful delivery.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 grid md:grid-cols-5 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center group"
              >
                {/* Connector */}
                {index !== steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[65%] w-full border-t-2 border-dashed border-orange-200"></div>
                )}

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="relative mx-auto w-16 h-16 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center group-hover:bg-orange-700 group-hover:text-white transition duration-300"
                >
                  <Icon size={28} />
                </motion.div>

                <h3 className="mt-6 text-lg font-bold text-gray-950">{step.title}</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
