import { Menu, X, Truck } from "lucide-react";
import { useState } from "react";

function Navbar() {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: "Home", link: "#home" },
    { name: "Features", link: "#features" },
    { name: "How It Works", link: "#how-it-works" },
    { name: "Solutions", link: "#solutions" },
    { name: "Contact", link: "#contact" }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-700 flex items-center justify-center text-white shadow-md">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-orange-900">FleetX</h1>
            <p className="text-xs text-gray-500">Smart Logistics Platform</p>
          </div>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.link}
              className="text-sm font-medium text-gray-700 hover:text-orange-700 transition"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="px-5 py-2 rounded-lg border border-orange-700 text-orange-700 hover:bg-orange-50 transition"
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

        {/* Mobile Button */}
        <button className="md:hidden text-orange-700" onClick={() => setOpen(!open)}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-orange-100 px-6 py-5">
          <div className="flex flex-col gap-5">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.link}
                onClick={() => setOpen(false)}
                className="text-gray-700 hover:text-orange-700"
              >
                {item.name}
              </a>
            ))}
            <a href="/login" className="text-orange-700 font-medium">
              Login
            </a>
            <a href="/register" className="bg-orange-700 text-white text-center py-2 rounded-lg">
              Sign Up
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
