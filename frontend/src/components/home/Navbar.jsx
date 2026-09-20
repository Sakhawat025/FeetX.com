function Navbar() {
  const menuItems = [
    {
      name: "Home",
      link: "#home"
    },
    {
      name: "Features",
      link: "#features"
    },
    {
      name: "How It Works",
      link: "#how-it-works"
    },
    {
      name: "Solutions",
      link: "#solutions"
    },
    {
      name: "Contact",
      link: "#contact"
    }
  ];

  return (
    <nav className="w-full bg-white border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
          <div>
            <h1 className="text-xl font-bold text-orange-900">FeetX</h1>
            <p className="text-xs text-gray-500">Delivering Trust</p>
          </div>
        </a>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.link}
              className="text-gray-700 text-sm font-medium hover:text-orange-600 transition"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <a
            href="/login"
            className="px-5 py-2 rounded-lg border border-orange-600 text-orange-700 hover:bg-orange-50 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-5 py-2 rounded-lg bg-orange-700 text-white hover:bg-orange-800 transition"
          >
            Sign Up
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
