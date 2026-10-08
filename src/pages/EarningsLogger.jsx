import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { earningsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useDemoStore } from "../store/demoStore";
import { DEMO_EARNINGS, DEMO_WORKER } from "../data/demoData";
import { detectAnomaly, generateAlerts, calcDeductionPct, rollingAverageDeductionPct } from "../utils/anomalyDetection";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import AlertBanner from "../components/ui/AlertBanner";

const pkr = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

const PLATFORMS = ["Uber", "Foodpanda", "Fiverr", "Careem", "Bykea"];
const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"];

const STEPS = [
  { id: 1, title: "Platform & Location", icon: "📍" },
  { id: 2, title: "Earnings Details", icon: "💰" },
  { id: 3, title: "Upload Evidence", icon: "📸" },
  { id: 4, title: "Review & Submit", icon: "✅" },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 80 : -80, opacity: 0 }),
};

export default function EarningsLogger() {
  const user = useAuthStore((s) => s.user);
  const isDemo = useDemoStore((s) => s.isDemoMode);
  const demoStep = useDemoStore((s) => s.demoStep);

  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [liveAnomaly, setLiveAnomaly] = useState(null);
  const fileRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue, trigger } = useForm({
    defaultValues: {
      platform: "", city: user?.city || "", date: new Date().toISOString().split("T")[0],
      grossEarnings: "", deductions: "", hoursWorked: "",
    },
  });

  const fv = watch();

  // Load data
  useEffect(() => {
    const load = async () => {
      if (isDemo) {
        const workerEarnings = DEMO_EARNINGS.filter(e => e.workerId === DEMO_WORKER.id);
        setEarningsData(workerEarnings);
        setLoading(false);
        return;
      }
      if (!user?.id) { setLoading(false); return; }
      try {
        const res = await earningsApi.get(`/earnings/${user.id}`);
        setEarningsData(res.data.data?.earnings || []);
      } catch { setEarningsData([]); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id, isDemo]);

  // Live anomaly detection as user types
  useEffect(() => {
    const gross = Number(fv.grossEarnings || 0);
    const deductions = Number(fv.deductions || 0);
    if (gross > 0 && deductions >= 0) {
      const result = detectAnomaly(
        { amount: gross - deductions, grossEarnings: gross, deductions, hoursWorked: Number(fv.hoursWorked || 0) },
        earningsData
      );
      setLiveAnomaly(result);
    } else {
      setLiveAnomaly(null);
    }
  }, [fv.grossEarnings, fv.deductions, fv.hoursWorked, earningsData]);

  const alerts = useMemo(() => generateAlerts(earningsData), [earningsData]);

  const nextStep = async () => {
    let valid = true;
    if (currentStep === 1) valid = await trigger(["platform", "city", "date"]);
    if (currentStep === 2) valid = await trigger(["grossEarnings", "deductions", "hoursWorked"]);
    if (valid && currentStep < 4) { setDirection(1); setCurrentStep(s => s + 1); }
  };
  const prevStep = () => { if (currentStep > 1) { setDirection(-1); setCurrentStep(s => s - 1); } };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isDemo) {
        const anomaly = detectAnomaly(
          { amount: data.grossEarnings - data.deductions, grossEarnings: data.grossEarnings, deductions: data.deductions, hoursWorked: data.hoursWorked },
          earningsData
        );
        const newEntry = {
          id: `e_demo_${Date.now()}`, workerId: DEMO_WORKER.id, workerName: DEMO_WORKER.name,
          platform: data.platform, city: data.city, date: data.date,
          amount: data.grossEarnings - data.deductions, grossEarnings: data.grossEarnings,
          deductions: data.deductions, hoursWorked: data.hoursWorked,
          isVerified: false, anomalyScore: anomaly.score, anomalyMessage: anomaly.message,
          screenshotUrl: previewUrl, createdAt: new Date().toISOString(),
        };
        setEarningsData(prev => [newEntry, ...prev]);
        useDemoStore.getState().advanceDemoStep();
      } else {
        const formData = new FormData();
        formData.append("workerId", user.id);
        formData.append("platform", data.platform);
        formData.append("city", data.city);
        formData.append("date", data.date);
        formData.append("amount", data.grossEarnings - data.deductions);
        formData.append("grossEarnings", data.grossEarnings);
        formData.append("deductions", data.deductions);
        formData.append("hoursWorked", data.hoursWorked);
        if (fv.screenshot) formData.append("screenshot", fv.screenshot);
        await earningsApi.post("/earnings", formData, { headers: { "Content-Type": "multipart/form-data" } });
        try {
          const res = await earningsApi.get(`/earnings/${user.id}`);
          setEarningsData(res.data.data?.earnings || []);
        } catch { /* keep existing */ }
      }
      toast.success("Earnings logged successfully!");
      reset(); setPreviewUrl(null); setCurrentStep(1); setLiveAnomaly(null);
    } catch { toast.error("Failed to log earnings."); }
    finally { setIsSubmitting(false); }
  };

  const netEarnings = Number(fv.grossEarnings || 0) - Number(fv.deductions || 0);
  const dedPct = fv.grossEarnings ? calcDeductionPct(Number(fv.grossEarnings), Number(fv.deductions || 0)) : 0;

  const chartData = useMemo(() =>
    earningsData.slice(0, 10).map(e => ({
      date: new Date(e.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" }),
      net: e.amount || 0, deductions: e.deductions || 0,
      flagged: (e.anomalyScore || 0) > 30,
    })).reverse()
  , [earningsData]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PLATFORMS.map(p => (
                <motion.button key={p} type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setValue("platform", p, { shouldValidate: true })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${fv.platform === p ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "bg-white/60 text-slate-600 border border-slate-200 hover:border-brand-300"}`}>
                  {p}
                </motion.button>
              ))}
            </div>
            <input type="hidden" {...register("platform", { required: "Select a platform" })} />
            {errors.platform && <p className="mt-1.5 text-xs text-red-500">{errors.platform.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <select {...register("city", { required: "City is required" })}
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.city && <p className="mt-1.5 text-xs text-red-500">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input type="date" {...register("date", { required: "Date is required" })}
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            {errors.date && <p className="mt-1.5 text-xs text-red-500">{errors.date.message}</p>}
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gross Earnings (PKR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₨</span>
                <input type="number" placeholder="5000" {...register("grossEarnings", { required: "Required", min: { value: 1, message: "Must be > 0" } })}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              {errors.grossEarnings && <p className="mt-1.5 text-xs text-red-500">{errors.grossEarnings.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Deductions (PKR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₨</span>
                <input type="number" placeholder="500" {...register("deductions", { required: "Required", min: { value: 0, message: "Must be ≥ 0" } })}
                  className={`w-full pl-9 pr-4 py-3 rounded-xl bg-white/60 border text-slate-800 focus:ring-2 outline-none transition-all ${dedPct > 30 ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"}`} />
              </div>
              {errors.deductions && <p className="mt-1.5 text-xs text-red-500">{errors.deductions.message}</p>}
            </div>
          </div>

          {/* Live anomaly alert */}
          {liveAnomaly?.isAnomaly && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-sm border ${liveAnomaly.score > 50 ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              <p className="font-semibold">{liveAnomaly.score > 50 ? "🚨 Critical Anomaly" : "⚠️ Anomaly Detected"}</p>
              <p className="mt-1 text-xs opacity-90">{liveAnomaly.message || liveAnomaly.reasons.join(". ")}</p>
              <p className="mt-1 text-xs opacity-70">Deduction: {liveAnomaly.deductionPct.toFixed(1)}% · Your avg: {liveAnomaly.avgPct.toFixed(1)}% · Deviation: {liveAnomaly.deviation.toFixed(1)}%</p>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hours Worked</label>
            <input type="number" step="0.5" placeholder="8" {...register("hoursWorked", { required: "Required", min: { value: 0.5, message: "Min 0.5h" }, max: { value: 24, message: "Max 24h" } })}
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
            {errors.hoursWorked && <p className="mt-1.5 text-xs text-red-500">{errors.hoursWorked.message}</p>}
          </div>

          {netEarnings > 0 && fv.hoursWorked > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100/50 border border-brand-200">
              <div className="flex justify-between items-center">
                <div><p className="text-xs text-slate-500">Net Earnings</p><p className="text-xl font-bold text-slate-800">{pkr(netEarnings)}</p></div>
                <div className="text-right"><p className="text-xs text-slate-500">Hourly Rate</p><p className="text-lg font-semibold text-brand-600">{pkr(netEarnings / Number(fv.hoursWorked))}/hr</p></div>
              </div>
            </motion.div>
          )}
        </div>
      );
      case 3: return (
        <div className="space-y-5">
          <input type="file" ref={fileRef} accept="image/*" onChange={e => {
            const f = e.target.files?.[0];
            if (f) { if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; } setPreviewUrl(URL.createObjectURL(f)); setValue("screenshot", f); }
          }} className="hidden" />
          {!previewUrl ? (
            <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => fileRef.current?.click()}
              className="w-full py-12 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 bg-white/40 hover:bg-white/60 transition-all group">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors"><span className="text-2xl">📸</span></div>
                <p className="text-sm font-medium text-slate-700">Click to upload screenshot</p>
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
              </div>
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button type="button" onClick={() => { setPreviewUrl(null); setValue("screenshot", null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors text-sm">×</button>
            </motion.div>
          )}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
            <p className="text-sm text-blue-800"><span className="font-medium">ℹ️ Why screenshots matter:</span> Evidence helps verifiers confirm earnings faster. Payment receipts, app earnings pages, or bank transfers are all valid.</p>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white/80 border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Review Your Entry</h3>
            {[
              ["Platform", fv.platform], ["City", fv.city], ["Date", new Date(fv.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })],
              ["Hours Worked", `${fv.hoursWorked} hrs`], ["Gross Earnings", pkr(fv.grossEarnings)], ["Deductions", `-${pkr(fv.deductions)}`],
            ].map(([label, value], i) => (
              <div key={i} className={`flex justify-between py-2 ${i < 5 ? "border-b border-slate-100" : ""}`}>
                <span className="text-slate-500 text-sm">{label}</span>
                <span className={`font-medium text-sm ${label === "Deductions" ? "text-red-600" : "text-slate-800"}`}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 mt-2 bg-brand-50 -mx-5 px-5 rounded-lg">
              <span className="font-medium text-slate-700 text-sm">Net Earnings</span>
              <span className="font-bold text-brand-600 text-lg">{pkr(netEarnings)}</span>
            </div>
          </div>
          {liveAnomaly?.isAnomaly && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800">⚠️ This entry will be flagged with anomaly score {liveAnomaly.score}/100</p>
              <p className="text-xs text-amber-700 mt-1">{liveAnomaly.reasons[0]}</p>
            </div>
          )}
          {previewUrl && <div className="mt-2"><span className="text-xs text-slate-400">Attached Evidence</span><div className="mt-1 w-20 h-14 rounded-lg overflow-hidden border border-slate-200"><img src={previewUrl} alt="" className="w-full h-full object-cover" /></div></div>}
        </div>
      );
      default: return null;
    }
  };

  if (loading) return <div className="space-y-6"><div className="skeleton h-28 w-full" /><div className="skeleton h-64 w-full" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Earnings Logger</h1>
          <p className="text-slate-500 mt-1 text-sm">Log your daily earnings and track your income over time</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium">{earningsData.length} entries</div>
      </div>

      {/* Smart Alerts */}
      <AlertBanner alerts={alerts} />

      <div className="grid xl:grid-cols-5 gap-6">
        {/* Form */}
        <div className="xl:col-span-3">
          <Card className="p-0" hover={false}>
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Log New Earnings</h2>
              <p className="text-xs text-slate-500 mt-1">Fill in the details to record your earnings</p>
            </div>
            {/* Stepper */}
            <div className="px-5 py-3 bg-slate-50/50 flex items-center justify-between gap-1 overflow-x-auto">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <button type="button" onClick={() => { if (currentStep > step.id) { setDirection(-1); setCurrentStep(step.id); } }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${currentStep === step.id ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : currentStep > step.id ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    <span>{currentStep > step.id ? "✓" : step.icon}</span>
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-1 ${currentStep > step.id ? "bg-emerald-300" : "bg-slate-200"}`} />}
                </div>
              ))}
            </div>
            {/* Form body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-5">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={currentStep} custom={direction} variants={slideVariants}
                  initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={prevStep} disabled={currentStep === 1}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${currentStep === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  ← Back
                </motion.button>
                {currentStep < 4 ? (
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextStep}
                    className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25">
                    Continue →
                  </motion.button>
                ) : (
                  <motion.button type="submit" disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : "✓ Submit Entry"}
                  </motion.button>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar: Stats + Chart */}
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-to-br from-brand-600 to-brand-700 text-white" hover={false}>
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">This Month</p>
              <p className="text-lg font-bold mt-0.5">{pkr(earningsData.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + (e.amount || 0), 0))}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" hover={false}>
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">Avg/Hour</p>
              <p className="text-lg font-bold mt-0.5">{pkr(earningsData.length ? earningsData.reduce((s, e) => s + ((e.amount || 0) / (e.hoursWorked || 1)), 0) / earningsData.length : 0)}</p>
            </Card>
          </div>
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Net vs. Deductions Trend</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B6FE8" stopOpacity={0.25} /><stop offset="95%" stopColor="#3B6FE8" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gDed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} /><stop offset="95%" stopColor="#DC2626" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(v, n) => [pkr(v), n === "net" ? "Net" : "Deductions"]} />
                  <Area type="monotone" dataKey="net" stroke="#3B6FE8" strokeWidth={2.5} fill="url(#gNet)" />
                  <Area type="monotone" dataKey="deductions" stroke="#DC2626" strokeWidth={1.5} fill="url(#gDed)" strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-400"><span className="text-2xl mb-1">📊</span><p className="text-xs">No data yet. Start logging!</p></div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Logs */}
      <Card className="p-5" hover={false}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-700">Recent Logs</h3>
        </div>
        {earningsData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-2.5 pr-3">Date</th><th className="pb-2.5 pr-3">Platform</th><th className="pb-2.5 pr-3">Gross</th><th className="pb-2.5 pr-3">Ded.</th><th className="pb-2.5 pr-3">Net</th><th className="pb-2.5 pr-3">Hrs</th><th className="pb-2.5 pr-3">Anomaly</th><th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {earningsData.slice(0, 8).map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 pr-3 text-slate-600">{new Date(e.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}</td>
                    <td className="py-2.5 pr-3 font-medium text-slate-800">{e.platform}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{pkr(e.grossEarnings || (e.amount + e.deductions))}</td>
                    <td className="py-2.5 pr-3 text-red-500">-{pkr(e.deductions)}</td>
                    <td className="py-2.5 pr-3 font-semibold text-emerald-600">{pkr(e.amount)}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{e.hoursWorked}h</td>
                    <td className="py-2.5 pr-3">{(e.anomalyScore || 0) > 30 ? <Badge variant={e.anomalyScore >= 60 ? "high" : "medium"}>⚠ {e.anomalyScore}</Badge> : <span className="text-emerald-500 text-xs">✓ Normal</span>}</td>
                    <td className="py-2.5"><Badge variant={e.isVerified ? "verified" : "pending"}>{e.isVerified ? "Verified" : "Pending"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3"><span className="text-3xl">📋</span></div>
            <h4 className="text-base font-semibold text-slate-700 mb-1">No earnings logged yet</h4>
            <p className="text-xs text-slate-500 max-w-xs">Start logging your earnings to track income, detect anomalies, and build your verified record.</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
