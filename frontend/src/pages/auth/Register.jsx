import { User, Mail, Phone, MapPin, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password does not match");
      return;
    }

    setLoading(true);
    try {
      const user = { role: "CUSTOMER" };
      if (user.role === "CUSTOMER") {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-orange-100 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-700 text-white flex items-center justify-center">
            <User size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-gray-950">Create Account</h1>
          <p className="mt-2 text-gray-500 text-sm">Register as a FeetX customer</p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <InputField icon={<User size={18} />} name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
          <InputField icon={<Mail size={18} />} name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
          <InputField icon={<Phone size={18} />} name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
          <InputField icon={<MapPin size={18} />} name="address" placeholder="Delivery Address" value={formData.address} onChange={handleChange} />
          <InputField icon={<Lock size={18} />} name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <InputField icon={<Lock size={18} />} name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-700 text-white py-3 rounded-xl font-semibold hover:bg-orange-800 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?
          <Link to="/login" className="ml-2 text-orange-700 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
}

function InputField({ icon, name, type = "text", placeholder, value, onChange }) {
  return (
    <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
      <span className="text-gray-400">{icon}</span>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} required className="w-full outline-none text-sm" />
    </div>
  );
}

export default Register;
