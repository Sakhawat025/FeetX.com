import { Mail, Lock, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = {
        id: 1,
        name: "Demo User",
        email,
        role: "RIDER"
      };

      login(userData);

      if (userData.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (userData.role === "RIDER") {
        navigate("/rider/dashboard");
      } else if (userData.role === "CUSTOMER") {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-orange-100 p-8">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-700 text-white flex items-center justify-center">
            <UserCircle size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-500 text-sm">Login to your FeetX account</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <div className="mt-2 flex items-center gap-3 border rounded-xl px-4 py-3">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                className="w-full outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="mt-2 flex items-center gap-3 border rounded-xl px-4 py-3">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full outline-none"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button disabled={loading} className="w-full bg-orange-700 text-white py-3 rounded-xl font-semibold hover:bg-orange-800 transition">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don't have an account?
          <Link to="/register" className="ml-2 text-orange-700 font-semibold">Create Account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
