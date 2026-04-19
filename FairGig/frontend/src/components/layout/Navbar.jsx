import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useDemoStore } from "../../store/demoStore";
import Badge from "../ui/Badge";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const isDemo = useDemoStore((s) => s.isDemoMode);
  const demoStep = useDemoStore((s) => s.demoStep);
  const enableDemo = useDemoStore((s) => s.enableDemo);
  const disableDemo = useDemoStore((s) => s.disableDemo);
  const startDemoFlow = useDemoStore((s) => s.startDemoFlow);

  const DEMO_STEPS = ["", "Earnings Logged", "Anomaly Detected", "Grievance Filed", "Verified", "Certificate Ready"];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">FG</span>
        </div>
        <span className="text-lg font-bold text-brand-900 hidden sm:block">FairGig</span>
        {isDemo && (
          <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Demo Step {demoStep}: {DEMO_STEPS[demoStep] || "Ready"}
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-1.5">
          {!isDemo ? (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={startDemoFlow}
              className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5">
              <span>🎬</span> Demo Mode
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={disableDemo}
              className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5">
              <span>⏹</span> Exit Demo
            </motion.button>
          )}
        </div>

        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-800">{user?.name || "User"}</p>
          <p className="text-xs text-slate-400">{user?.city}</p>
        </div>
        <Badge variant={user?.role}>{user?.role}</Badge>
        <button
          onClick={() => { logout(); window.location.href = "/login"; }}
          className="text-sm text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
