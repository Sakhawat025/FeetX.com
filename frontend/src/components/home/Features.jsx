function Features() {
  const features = [
    {
      title: "Real-Time Fleet Monitoring",
      description:
        "Monitor riders, vehicles and delivery activities through a live operational dashboard.",
      icon: "📍"
    },
    {
      title: "Smart Route Optimization",
      description:
        "Generate efficient delivery routes by considering distance, locations and multiple stops.",
      icon: "🗺️"
    },
    {
      title: "Intelligent Dispatching",
      description:
        "Automatically recommend suitable riders based on location, workload and availability.",
      icon: "🚚"
    },
    {
      title: "Customer Tracking",
      description:
        "Provide customers with live parcel tracking, ETA and delivery progress updates.",
      icon: "📦"
    }
  ];

  return (
    <section id = "features" className="bg-orange-50 py-20 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-950">
            Powerful Logistics Features
          </h2>
          <p className="mt-4 text-gray-600">
            Everything you need to manage fleet operations,
            optimize deliveries and improve customer experience.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                {feature.icon}
              </div>

              <h3 className="mt-5 text-xl font-bold text-orange-900">
                {feature.title}
              </h3>

              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
