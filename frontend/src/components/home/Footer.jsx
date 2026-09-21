import { FaLinkedinIn, FaFacebookF, FaWhatsapp, FaInstagram } from "react-icons/fa";

function Footer() {
  const socials = [
    { icon: FaLinkedinIn, link: "#" },
    { icon: FaFacebookF, link: "#" },
    { icon: FaWhatsapp, link: "#" },
    { icon: FaInstagram, link: "#" }
  ];

  return (
    <footer id="contact" className="bg-gray-950 text-gray-300 py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <h3 className="text-3xl font-bold text-white">FeetX</h3>
          <p className="mt-4 text-sm leading-relaxed">
            Intelligent fleet and delivery route optimization platform helping businesses manage logistics smarter and faster.
          </p>

          {/* Social Icons */}
          <div className="flex gap-3 mt-6">
            {socials.map((item, index) => {
              const Icon = item.icon;
              return (
                <a
                  key={index}
                  href={item.link}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-orange-700 hover:text-white transition duration-300"
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-white font-semibold text-lg">Platform</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Features</li>
            <li>Route Optimization</li>
            <li>Fleet Management</li>
            <li>Live Tracking</li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold text-lg">Company</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li>About Us</li>
            <li>Careers</li>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-semibold text-lg">Support</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Email: support@feetx.com</li>
            <li>Phone: +880 1XXX-XXXXXX</li>
            <li>WhatsApp Support</li>
            <li>Help Center</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-800 text-center text-sm">
        © 2026 FeetX. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
