import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { earningsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useDemoStore } from "../store/demoStore";
import { DEMO_EARNINGS, DEMO_VERIFICATION_LOG, DEMO_VERIFIER } from "../data/demoData";
import { calcDeductionPct } from "../utils/anomalyDetection";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const pkr = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

const TABS = [
  { id: "pending", label: "Pending Review", icon: "⏳", color: "amber" },
  { id: "verified", label: "Verified", icon: "✅", color: "emerald" },
  { id: "rejected", label: "Rejected", icon: "❌", color: "red" },
  { id: "audit", label: "Audit Log", icon: "📋", color: "slate" },
];

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
};

function ConfidenceMeter({ score }) {
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function VerificationPanel() {
  const user = useAuthStore((s) => s.user);
  const isDemo = useDemoStore((s) => s.isDemoMode);
  const demoStep = useDemoStore((s) => s.demoStep);

  const [submissions, setSubmissions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { loadSubmissions(); }, []);

  const loadSubmissions = async () => {
    try {
      if (isDemo) {
        setSubmissions(DEMO_EARNINGS);
        setAuditLog(DEMO_VERIFICATION_LOG);
        return;
      }
      const res = await earningsApi.get("/earnings/pending");
      const data = res.data.data;
      setSubmissions(Array.isArray(data) ? data : data?.earnings || []);
    } catch {
      setSubmissions([]);
    } finally { setLoading(false); }
  };

  const computeConfidence = (entry) => {
    let score = 50;
    if (entry.screenshotUrl) score += 20;
    const dedPct = calcDeductionPct(entry.grossEarnings || (entry.amount + entry.deductions), entry.deductions || 0);
    if (dedPct <= 25) score += 20;
    else if (dedPct <= 35) score += 10;
    else score -= 10;
    if ((entry.anomalyScore || 0) < 20) score += 10;
    else if ((entry.anomalyScore || 0) > 50) score -= 15;
    if (entry.hoursWorked >= 4 && entry.hoursWorked <= 12) score += 5;
    return Math.min(100, Math.max(10, score));
  };

  const handleApprove = async (entry) => {
    setIsProcessing(true);
    try {
      const verifierId = isDemo ? DEMO_VERIFIER.id : user?.id || "verifier";
      const verifierName = isDemo ? DEMO_VERIFIER.name : user?.name || "Verifier";
      const confidence = computeConfidence(entry);

      if (!isDemo) {
        await earningsApi.put(`/earnings/${entry.id}/verify`, { isVerified: true, verifiedBy: verifierId });
      }

      const logEntry = {
        id: `vl_${Date.now()}`, earningId: entry.id, action: "approved",
        verifierId, verifierName, timestamp: new Date().toISOString(),
        confidence, notes: `Deduction ${(calcDeductionPct(entry.grossEarnings || (entry.amount + entry.deductions), entry.deductions || 0)).toFixed(1)}%`,
      };

      setSubmissions(prev => prev.map(s => s.id === entry.id ? { ...s, isVerified: true, verifiedBy: verifierId, verifiedAt: new Date().toISOString(), confidence } : s));
      setAuditLog(prev => [logEntry, ...prev]);
      if (isDemo) useDemoStore.getState().advanceDemoStep();
      toast.success("Earnings verified successfully!");
      setModalType(null); setSelectedSubmission(null);
    } catch { toast.error("Failed to verify earnings"); }
    finally { setIsProcessing(false); }
  };

  const handleReject = async (entry) => {
    if (!rejectReason.trim()) { toast.error("Please provide a reason"); return; }
    setIsProcessing(true);
    try {
      const verifierId = isDemo ? DEMO_VERIFIER.id : user?.id || "verifier";
      const verifierName = isDemo ? DEMO_VERIFIER.name : user?.name || "Verifier";

      if (!isDemo) {
        await earningsApi.put(`/earnings/${entry.id}/verify`, { isVerified: false, verifiedBy: verifierId, rejectionReason: rejectReason });
      }

      const logEntry = {
        id: `vl_${Date.now()}`, earningId: entry.id, action: "rejected",
        verifierId, verifierName, timestamp: new Date().toISOString(),
        confidence: 0, notes: rejectReason,
      };

      setSubmissions(prev => prev.map(s => s.id === entry.id ? { ...s, isVerified: false, status: "rejected", verifiedBy: verifierId, rejectionReason: rejectReason } : s));
      setAuditLog(prev => [logEntry, ...prev]);
      toast.success("Entry rejected");
      setModalType(null); setSelectedSubmission(null); setRejectReason("");
    } catch { toast.error("Failed to reject earnings"); }
    finally { setIsProcessing(false); }
  };

  const filtered = useMemo(() => {
    if (activeTab === "pending") return submissions.filter(s => !s.isVerified);
    if (activeTab === "verified") return submissions.filter(s => s.isVerified === true);
    if (activeTab === "rejected") return submissions.filter(s => s.isVerified === false && s.rejectionReason);
    return [];
  }, [submissions, activeTab]);

  const counts = useMemo(() => ({
    pending: submissions.filter(s => !s.isVerified).length,
    verified: submissions.filter(s => s.isVerified === true).length,
    rejected: submissions.filter(s => s.isVerified === false && s.rejectionReason).length,
  }), [submissions]);

  if (loading) return <div className="space-y-6"><div className="skeleton h-28 w-full" /><div className="skeleton h-64 w-full" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Verification Panel</h1>
          <p className="text-slate-500 mt-1 text-sm">Review and authenticate submitted gig worker earnings</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadSubmissions}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
          ↻ Refresh
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(tab => (
          <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "bg-white/60 text-slate-600 border border-slate-200 hover:border-slate-300"}`}>
            <span className="mr-1.5">{tab.icon}</span>{tab.label}
            {tab.id !== "audit" && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-white/20" : "bg-slate-100"}`}>{counts[tab.id] || 0}</span>}
          </motion.button>
        ))}
      </div>

      {/* Audit Log Tab */}
      {activeTab === "audit" ? (
        <Card className="p-5" hover={false}>
          <h3 className="text-base font-semibold text-slate-700 mb-4">Verification Audit Trail</h3>
          {auditLog.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="pb-2.5 pr-3">Timestamp</th><th className="pb-2.5 pr-3">Action</th><th className="pb-2.5 pr-3">Entry ID</th><th className="pb-2.5 pr-3">Verified By</th><th className="pb-2.5 pr-3">Confidence</th><th className="pb-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 pr-3 text-slate-600">{new Date(log.timestamp).toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2.5 pr-3"><Badge variant={log.action === "approved" ? "verified" : "rejected"}>{log.action === "approved" ? "✅ Approved" : "❌ Rejected"}</Badge></td>
                      <td className="py-2.5 pr-3 text-slate-500 font-mono text-xs">{log.earningId}</td>
                      <td className="py-2.5 pr-3 text-slate-700">{log.verifierName} <span className="text-slate-400 text-xs">({log.verifierId})</span></td>
                      <td className="py-2.5 pr-3 w-32"><ConfidenceMeter score={log.confidence} /></td>
                      <td className="py-2.5 text-slate-500 text-xs max-w-xs truncate">{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center"><span className="text-3xl">📋</span><p className="text-sm text-slate-500 mt-2">No audit entries yet</p></div>
          )}
        </Card>
      ) : (
        /* Cards Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(entry => {
              const gross = entry.grossEarnings || (entry.amount + entry.deductions) || 1;
              const dedPct = calcDeductionPct(gross, entry.deductions || 0);
              const confidence = computeConfidence(entry);
              return (
                <motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}>
                  <Card className="overflow-hidden flex flex-col" hover={false}>
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                          {entry.workerName?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{entry.workerName || "Worker"}</p>
                          <p className="text-xs text-slate-500">{entry.platform} · {new Date(entry.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}</p>
                        </div>
                      </div>
                      {(entry.anomalyScore || 0) > 30 && <Badge variant={entry.anomalyScore >= 60 ? "high" : "medium"}>⚠ {entry.anomalyScore}</Badge>}
                    </div>

                    <div className="p-4 flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <p className="text-[10px] text-slate-500 uppercase">Gross</p>
                          <p className="text-sm font-semibold text-slate-800">{pkr(gross)}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                          <p className="text-[10px] text-red-600 uppercase">Deducted</p>
                          <p className="text-sm font-semibold text-red-700">{pkr(entry.deductions)}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-brand-50 border border-brand-100 flex justify-between items-center">
                        <div><p className="text-[10px] text-brand-600 uppercase">Net</p><p className="text-lg font-bold text-brand-900">{pkr(entry.amount)}</p></div>
                        <div className="text-right"><p className="text-[10px] text-brand-600 uppercase">Hours</p><p className="text-sm font-bold text-brand-900">{entry.hoursWorked}h</p></div>
                      </div>

                      {/* Confidence Score */}
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Confidence Score</p>
                        <ConfidenceMeter score={confidence} />
                      </div>

                      {/* Deduction % indicator */}
                      {dedPct > 25 && (
                        <div className={`p-2.5 rounded-lg text-xs ${dedPct > 35 ? "bg-red-50 border border-red-200 text-red-700" : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
                          ⚠ Deduction rate: {dedPct.toFixed(1)}% {dedPct > 35 ? "— Critical" : "— Above normal"}
                        </div>
                      )}

                      {/* Screenshot */}
                      {entry.screenshotUrl && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setLightboxImage(entry.screenshotUrl)}
                          className="w-full p-3 rounded-lg border border-slate-200 border-dashed bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-600 flex items-center justify-center gap-2">
                          📸 View Screenshot Proof
                        </motion.button>
                      )}
                    </div>

                    {/* Actions */}
                    {activeTab === "pending" && (
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => { setSelectedSubmission(entry); setModalType("reject"); }}
                          className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors">
                          Reject
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => { setSelectedSubmission(entry); setModalType("approve"); }}
                          className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
                          ✅ Approve
                        </motion.button>
                      </div>
                    )}

                    {/* Verified info */}
                    {activeTab === "verified" && entry.verifiedBy && (
                      <div className="p-3 border-t border-slate-100 text-xs text-slate-500">
                        Verified by <span className="font-medium text-slate-700">{entry.verifiedBy}</span> · {entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short" }) : "—"}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3"><span className="text-3xl">{activeTab === "pending" ? "🎉" : activeTab === "verified" ? "✅" : "📋"}</span></div>
              <h4 className="text-base font-semibold text-slate-700 mb-1">
                {activeTab === "pending" ? "All caught up!" : activeTab === "verified" ? "No verified entries" : "No rejected entries"}
              </h4>
              <p className="text-xs text-slate-500">
                {activeTab === "pending" ? "No pending submissions to review" : "Check other tabs for more"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      <AnimatePresence>
        {modalType === "approve" && selectedSubmission && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setModalType(null); setSelectedSubmission(null); }}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><span className="text-lg">✅</span></div>
                <div><h3 className="text-lg font-bold text-slate-800">Approve Entry</h3><p className="text-xs text-slate-500">Confirm this earnings submission</p></div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Worker</span><span className="font-medium text-slate-800">{selectedSubmission.workerName}</span></div>
                <div className="flex justify-between text-sm mt-2"><span className="text-slate-500">Net Earnings</span><span className="font-bold text-brand-600">{pkr(selectedSubmission.amount)}</span></div>
                <div className="flex justify-between text-sm mt-2"><span className="text-slate-500">Confidence</span><span className="font-medium">{computeConfidence(selectedSubmission)}%</span></div>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setModalType(null); setSelectedSubmission(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isProcessing}
                  onClick={() => handleApprove(selectedSubmission)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                  {isProcessing ? "Processing..." : "Confirm Approval"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {modalType === "reject" && selectedSubmission && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setModalType(null); setSelectedSubmission(null); setRejectReason(""); }}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><span className="text-lg">❌</span></div>
                <div><h3 className="text-lg font-bold text-slate-800">Reject Entry</h3><p className="text-xs text-slate-500">Provide a reason for rejection</p></div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Worker</span><span className="font-medium text-slate-800">{selectedSubmission.workerName}</span></div>
                <div className="flex justify-between text-sm mt-2"><span className="text-slate-500">Net</span><span className="font-bold text-brand-600">{pkr(selectedSubmission.amount)}</span></div>
              </div>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection (required)..."
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none text-sm mb-4" />
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setModalType(null); setSelectedSubmission(null); setRejectReason(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isProcessing}
                  onClick={() => handleReject(selectedSubmission)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25 disabled:opacity-50">
                  {isProcessing ? "Processing..." : "Confirm Rejection"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightboxImage(null)}>
            <motion.img src={lightboxImage} alt="Screenshot" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="max-w-3xl max-h-[85vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
            <button onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xl">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
