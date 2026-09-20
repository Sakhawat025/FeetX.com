function Stats() {
  const stats = [
    {
      number: "500+",
      title: "Active Riders"
    },
    {
      number: "10K+",
      title: "Successful Deliveries"
    },
    {
      number: "99%",
      title: "On-Time Delivery"
    },
    {
      number: "50+",
      title: "Business Partners"
    }
  ];

  return (
    <section className="bg-white border-y border-orange-100 py-10">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((item, index) => (
          <div key={index} className="text-center">
            <h2 className="text-4xl font-extrabold text-orange-900">
              {item.number}
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
