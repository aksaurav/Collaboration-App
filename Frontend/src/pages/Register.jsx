import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { UserPlus, Mail, Lock, User, AlertCircle } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/users/register", formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    // min-h-screen with py-8 ensures the card doesn't touch the top/bottom on small phones
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 to-blue-100 px-4 py-8">
      {/* w-full for mobile, max-w-md for desktop. Padding scales from p-6 to p-10 */}
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-2xl bg-white p-6 sm:p-10 shadow-xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <UserPlus size={28} />
          </div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Get Started
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Create your account to start collaborating
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-600 border border-red-100">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Username Field */}
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                required
                className="block w-full rounded-lg border border-gray-300 py-2.5 sm:py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="Username"
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="email"
                required
                className="block w-full rounded-lg border border-gray-300 py-2.5 sm:py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="Email address"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="password"
                required
                className="block w-full rounded-lg border border-gray-300 py-2.5 sm:py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                placeholder="Password"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
