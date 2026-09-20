function Hero() {
  return (
    <section id = "home" className="bg-orange-50 px-8 py-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-gray-950">
            Smart Delivery.
            <br />
            <span className="text-orange-900">Optimized Routes.</span>
            <br />
            Real-Time Fleet Control.
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
            FeetX helps businesses manage riders, parcels and
            deliveries with intelligent routing and real-time
            fleet tracking.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex gap-4">
            <button className="px-7 py-3 rounded-xl bg-orange-700 text-white font-semibold hover:bg-orange-800">
              Get Started Free →
            </button>
            <button className="px-7 py-3 rounded-xl border border-orange-600 text-orange-700 font-semibold hover:bg-orange-100">
              Live Demo ▶
            </button>
          </div>

          {/* Trust */}
          <div className="mt-8 flex gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Setup in 2 minutes
            </div>
          </div>
        </div>

        {/* Right Dashboard Preview */}
        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-orange-800 text-xl">🚚 FeetX</h3>
            <div className="w-10 h-10 rounded-full bg-orange-100"></div>
          </div>

          {/* Dashboard */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              ["1,248", "Total"],
              ["320", "Progress"],
              ["928", "Delivered"],
              ["25", "Cancelled"]
            ].map((item, index) => (
              <div key={index} className="bg-white border rounded-xl p-3 shadow-sm">
                <h4 className="font-bold text-xl">{item[0]}</h4>
                <p className="text-xs text-gray-500">{item[1]}</p>
              </div>
            ))}
          </div>

          {/* Map Preview */}
          <div className="mt-6 h-64 rounded-2xl bg-orange-100 relative overflow-hidden">
            <div className="absolute top-16 left-10 w-52 h-1 bg-orange-500 rotate-12"></div>
            <div className="absolute bottom-16 right-10 w-52 h-1 bg-blue-500 -rotate-12"></div>
            <div className="absolute top-20 left-40 w-4 h-4 rounded-full bg-green-500"></div>
            <div className="absolute bottom-20 right-20 w-4 h-4 rounded-full bg-blue-600"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
