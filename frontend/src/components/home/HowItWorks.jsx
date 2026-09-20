function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Delivery",
      description:
        "Create parcel requests with pickup, destination and delivery details."
    },
    {
      number: "02",
      title: "Assign Rider",
      description:
        "System recommends the most suitable rider based on availability and location."
    },
    {
      number: "03",
      title: "Optimize Route",
      description:
        "Generate efficient delivery routes with multiple stop optimization."
    },
    {
      number: "04",
      title: "Live Tracking",
      description:
        "Monitor rider movement and delivery progress in real time."
    },
    {
      number: "05",
      title: "Delivered",
      description:
        "Complete delivery with status update and proof of delivery."
    }
  ];

  return (
    <section id = "how-it-works" className="bg-white py-20 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-950">
            How FeetX Works
          </h2>
          <p className="mt-4 text-gray-600">
            From parcel creation to successful delivery,
            everything is managed through an intelligent workflow.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-14 grid md:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-700 text-white flex items-center justify-center text-xl font-bold">
                {step.number}
              </div>

              <h3 className="mt-5 font-bold text-lg text-orange-900">
                {step.title}
              </h3>

              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {step.description}
              </p>

              {index !== steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[75%] w-full border-t-2 border-dashed border-orange-300"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
