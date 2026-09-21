import { Mail, Lock, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = { role: "ADMIN" };

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "RIDER") {
        navigate("/rider/dashboard");
      } else if (user.role === "CUSTOMER") {
        navigate("/customer/dashboard");
      }
    } catch (error) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-orange-100 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-700 text-white flex items-center justify-center">
            <UserCircle size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-gray-950">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-500">Login to your FeetX account</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="mt-2 flex items-center gap-3 border rounded-xl px-4 py-3">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="mt-2 flex items-center gap-3 border rounded-xl px-4 py-3">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full outline-none text-sm"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-700 text-white py-3 rounded-xl font-semibold hover:bg-orange-800 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?
          <Link to="/register" className="ml-2 text-orange-700 font-semibold">Create Account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
