import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.post("/api/auth/login", form);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success(`Welcome back, ${user.name}`);
      navigate(user.role === "worker" ? "/dashboard" : user.role === "verifier" ? "/verify" : "/advocate");
    } catch {
      /* interceptor handles toast */
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 bg-white"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">FG</span>
            </div>
            <span className="text-2xl font-bold text-brand-900">FairGig</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@example.com"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-500 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>

      {/* Right — Hero */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-brand-500 to-brand-900 text-white p-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">Income fairness and<br />rights for every worker</h2>
          <p className="text-lg text-white/70 max-w-md">
            FairGig protects gig workers in Pakistan through real-time anomaly detection,
            fairness scoring, and verifiable income records.
          </p>
          <div className="mt-10 flex gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">3</p>
              <p className="text-sm text-white/50">Cities</p>
            </div>
            <div>
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm text-white/50">Platforms</p>
            </div>
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-white/50">Transparent</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
