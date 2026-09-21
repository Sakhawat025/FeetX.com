import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="w-full bg-white border-b px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-orange-700">
          FeetX
        </Link>

        {/* Menu */}
        <div className="flex items-center gap-6">
          <Link to="/">Home</Link>

          {user ? (
            <>
              <span className="text-sm font-medium text-gray-700">{user.role}</span>
              <button onClick={handleLogout} className="bg-orange-700 text-white px-4 py-2 rounded-xl">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-orange-700 font-semibold">
                Login
              </Link>
              <Link to="/register" className="bg-orange-700 text-white px-4 py-2 rounded-xl">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
