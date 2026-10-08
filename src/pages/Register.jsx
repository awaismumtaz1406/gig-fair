import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authApi } from "../services/api";

const ROLES = ["worker", "verifier", "advocate"];
const CITIES = ["Lahore", "Karachi", "Islamabad"];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "worker", city: "Lahore" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await authApi.post("/api/auth/register", form);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch {
      /* interceptor handles toast */
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-card p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">FG</span>
          </div>
          <span className="text-2xl font-bold text-brand-900">FairGig</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-6">Join the gig worker protection platform</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input value={form.name} onChange={set("name")} required minLength={2} placeholder="Ali Hassan"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={set("password")} required minLength={8} placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={set("role")}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white cursor-pointer">
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <select value={form.city} onChange={set("city")}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white cursor-pointer">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
