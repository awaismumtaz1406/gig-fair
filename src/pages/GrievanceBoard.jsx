import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { grievanceApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useDemoStore } from "../store/demoStore";
import { DEMO_COMPLAINTS, DEMO_WORKER } from "../data/demoData";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const PLATFORMS = ["Uber", "Foodpanda", "Fiverr", "Careem", "Bykea"];
const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"];

const ISSUE_TYPES = [
  { id: "unfair_deduction", label: "Unfair Deduction", icon: "💸" },
  { id: "account_blocked", label: "Account Blocked", icon: "🔒" },
  { id: "payment_delayed", label: "Payment Delayed", icon: "⏰" },
  { id: "customer_issue", label: "Customer Harassment", icon: "⚠️" },
  { id: "technical_issue", label: "App Technical Issue", icon: "📱" },
  { id: "other", label: "Other Issue", icon: "📋" },
];

const STATUS_CONFIG = {
  open: { label: "Open", variant: "open", icon: "📭", color: "blue", desc: "Submitted, awaiting review" },
  under_review: { label: "Under Review", variant: "under_review", icon: "👀", color: "amber", desc: "Being investigated by advocate" },
  resolved: { label: "Resolved", variant: "resolved", icon: "✅", color: "emerald", desc: "Issue addressed successfully" },
  dismissed: { label: "Dismissed", variant: "dismissed", icon: "❌", color: "slate", desc: "Not actionable" },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
};

function generateKeywords(type, title, description) {
  const keywords = [];
  const typeObj = ISSUE_TYPES.find(t => t.id === type);
  if (typeObj) keywords.push(typeObj.label);

  const text = `${title} ${description}`.toLowerCase();
  const map = {
    suspension: "Account Suspended", deactivated: "Account Deactivated", bonus: "Bonus Issue",
    incentive: "Incentive Missing", rating: "Rating Manipulation", surge: "Surge Pricing",
    cancel: "Wrongful Cancellation", fare: "Fare Dispute", tip: "Tip Missing",
    penalty: "Unfair Penalty", chargeback: "Chargeback", commission: "High Commission",
    wait: "Wait Time", support: "No Support", delay: "Payout Delay",
  };
  Object.entries(map).forEach(([k, v]) => { if (text.includes(k) && !keywords.includes(v)) keywords.push(v); });
  return keywords.slice(0, 3);
}

export default function GrievanceBoard() {
  const user = useAuthStore((s) => s.user);
  const isDemo = useDemoStore((s) => s.isDemoMode);
  const demoStep = useDemoStore((s) => s.demoStep);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: { platform: "", type: "", title: "", description: "", city: user?.city || "" },
  });
  const fv = watch();

  useEffect(() => { loadComplaints(); }, [user?.id, isDemo]);

  const loadComplaints = async () => {
    try {
      if (isDemo) { setComplaints(DEMO_COMPLAINTS); return; }
      const endpoint = user?.role === "advocate" ? "/complaints/all" : `/complaints/worker/${user?.id}`;
      const res = await grievanceApi.get(endpoint);
      setComplaints(res.data.data || []);
    } catch { setComplaints([]); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const keywords = generateKeywords(data.type, data.title, data.description);
      if (isDemo) {
        const newComplaint = {
          id: `c_demo_${Date.now()}`, workerId: DEMO_WORKER.id, workerName: DEMO_WORKER.name,
          platform: data.platform, type: data.type, title: data.title, description: data.description,
          status: "open", date: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(), keywords, resolution: null,
        };
        setComplaints(prev => [newComplaint, ...prev]);
        useDemoStore.getState().advanceDemoStep();
      } else {
        await grievanceApi.post("/complaints", {
          workerId: user.id, platform: data.platform, type: data.type,
          title: data.title, description: data.description, keywords, city: data.city,
        });
        loadComplaints();
      }
      toast.success("Complaint submitted successfully!");
      reset(); setShowForm(false);
    } catch { toast.error("Failed to submit complaint."); }
    finally { setIsSubmitting(false); }
  };

  const filtered = useMemo(() =>
    filterStatus === "all" ? complaints : complaints.filter(c => c.status === filterStatus)
  , [complaints, filterStatus]);

  const counts = useMemo(() => ({
    all: complaints.length, open: complaints.filter(c => c.status === "open").length,
    under_review: complaints.filter(c => c.status === "under_review").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
  }), [complaints]);

  const previewKeywords = useMemo(() => {
    if (fv.type && fv.title && fv.description) return generateKeywords(fv.type, fv.title, fv.description);
    return [];
  }, [fv.type, fv.title, fv.description]);

  if (loading) return <div className="space-y-6"><div className="skeleton h-28 w-full" /><div className="skeleton h-64 w-full" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Grievance Board</h1>
          <p className="text-slate-500 mt-1 text-sm">File complaints and track resolution status</p>
        </div>
        {user?.role !== "advocate" && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25 flex items-center gap-2">
            📝 Lodge Complaint
          </motion.button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "all", label: "All", icon: "📋" }, { id: "open", label: "Open", icon: "📭" },
          { id: "under_review", label: "Under Review", icon: "👀" }, { id: "resolved", label: "Resolved", icon: "✅" },
        ].map(tab => (
          <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filterStatus === tab.id ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "bg-white/60 text-slate-600 border border-slate-200 hover:border-slate-300"}`}>
            <span className="mr-1.5">{tab.icon}</span>{tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filterStatus === tab.id ? "bg-white/20" : "bg-slate-100"}`}>{counts[tab.id] || 0}</span>
          </motion.button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(c => {
            const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
            return (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}>
                <Card className={`p-5 border-l-4 ${
                  c.status === "open" ? "border-l-blue-400" : c.status === "under_review" ? "border-l-amber-400" :
                  c.status === "resolved" ? "border-l-emerald-400" : "border-l-slate-400"
                }`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider">{c.platform}</span>
                        <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{c.description}</p>
                      {c.keywords && c.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {c.keywords.map((kw, i) => (
                            <span key={i} className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">#{kw}</span>
                          ))}
                        </div>
                      )}
                      {/* Status Timeline */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {["open", "under_review", "resolved"].map((st, idx, arr) => {
                          const order = ["open", "under_review", "resolved"];
                          const isActive = order.indexOf(c.status) >= idx;
                          const isCurrent = c.status === st;
                          return (
                            <div key={st} className="flex items-center">
                              <div className={`w-2.5 h-2.5 rounded-full transition-all ${isActive ? isCurrent ? "bg-brand-500 ring-4 ring-brand-500/20" : "bg-brand-300" : "bg-slate-200"}`} />
                              {idx < arr.length - 1 && <div className={`w-8 h-0.5 ${isActive && !isCurrent ? "bg-brand-300" : "bg-slate-200"}`} />}
                            </div>
                          );
                        })}
                        <span className="text-[10px] text-slate-400 ml-2">{sc.desc}</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 min-w-[120px]">
                      <Badge variant={sc.variant}>{sc.icon} {sc.label}</Badge>
                      <span className="text-xs text-slate-400">{new Date(c.date || c.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}</span>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedComplaint(c)}
                        className="text-xs text-brand-600 font-medium hover:text-brand-700">View Details →</motion.button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white/60 rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3"><span className="text-3xl">{filterStatus === "all" ? "📭" : STATUS_CONFIG[filterStatus]?.icon || "📋"}</span></div>
            <h4 className="text-base font-semibold text-slate-700 mb-1">{filterStatus === "all" ? "No complaints filed yet" : `No ${STATUS_CONFIG[filterStatus]?.label || filterStatus} complaints`}</h4>
            <p className="text-xs text-slate-500 max-w-sm">{filterStatus === "all" ? "File a complaint to report issues with platforms. Your voice helps improve the gig economy." : STATUS_CONFIG[filterStatus]?.desc}</p>
            {user?.role !== "advocate" && filterStatus === "all" && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
                className="mt-4 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">+ File Your First Complaint</motion.button>
            )}
          </div>
        )}
      </div>

      {/* New Complaint Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-lg font-bold text-slate-800">File a Complaint</h2><p className="text-xs text-slate-500 mt-0.5">Report issues with gig platforms</p></div>
                  <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors text-sm">×</button>
                </div>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Issue Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ISSUE_TYPES.map(t => (
                      <motion.button key={t.id} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => register("type").onChange({ target: { value: t.id, name: "type" } })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${fv.type === t.id ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white/60 hover:border-slate-300"}`}>
                        <span className="text-lg">{t.icon}</span>
                        <p className={`text-xs font-medium mt-1 ${fv.type === t.id ? "text-brand-700" : "text-slate-700"}`}>{t.label}</p>
                      </motion.button>
                    ))}
                  </div>
                  <input type="hidden" {...register("type", { required: "Select an issue type" })} />
                  {errors.type && <p className="mt-1.5 text-xs text-red-500">{errors.type.message}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform</label>
                    <select {...register("platform", { required: "Required" })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm">
                      <option value="">Select platform</option>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.platform && <p className="mt-1 text-xs text-red-500">{errors.platform.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                    <select {...register("city", { required: "Required" })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm">
                      <option value="">Select city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                  <input type="text" placeholder="Brief summary of the issue" {...register("title", { required: "Required", minLength: { value: 10, message: "Min 10 chars" } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm" />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea rows={4} placeholder="Describe exactly what happened..." {...register("description", { required: "Required", minLength: { value: 30, message: "Min 30 chars" } })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none text-sm" />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                </div>

                {/* Auto-generated keywords preview */}
                {previewKeywords.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-800"><span className="font-medium">Auto-generated tags:</span> {previewKeywords.join(", ")}</p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</motion.button>
                  <motion.button type="submit" disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : "📤 Submit Complaint"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedComplaint(null)}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      selectedComplaint.status === "open" ? "bg-blue-100" : selectedComplaint.status === "under_review" ? "bg-amber-100" :
                      selectedComplaint.status === "resolved" ? "bg-emerald-100" : "bg-slate-100"
                    }`}>{STATUS_CONFIG[selectedComplaint.status]?.icon || "📋"}</div>
                    <div>
                      <Badge variant={STATUS_CONFIG[selectedComplaint.status]?.variant || "open"}>{STATUS_CONFIG[selectedComplaint.status]?.label}</Badge>
                      <p className="text-[10px] text-slate-400 mt-1">Filed {new Date(selectedComplaint.createdAt || selectedComplaint.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedComplaint(null)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors text-sm">×</button>
                </div>

                <div className="space-y-3">
                  <div><p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Platform</p><p className="text-sm font-medium text-slate-800">{selectedComplaint.platform}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Title</p><h3 className="text-sm font-semibold text-slate-800">{selectedComplaint.title}</h3></div>
                  <div><p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Description</p><p className="text-sm text-slate-600 leading-relaxed">{selectedComplaint.description}</p></div>
                  {selectedComplaint.keywords?.length > 0 && (
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1.5">{selectedComplaint.keywords.map((kw, i) => <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{kw}</span>)}</div>
                    </div>
                  )}
                  {selectedComplaint.resolution && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Resolution</p>
                      <p className="text-sm text-emerald-800">{selectedComplaint.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
