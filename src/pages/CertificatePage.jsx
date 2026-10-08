import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { earningsApi, certificateApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useDemoStore } from "../store/demoStore";
import { DEMO_EARNINGS, DEMO_WORKER } from "../data/demoData";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const pkr = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

export default function CertificatePage() {
  const user = useAuthStore((s) => s.user);
  const isDemo = useDemoStore((s) => s.isDemoMode);
  const demoStep = useDemoStore((s) => s.demoStep);
  const certRef = useRef(null);

  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certificateId, setCertificateId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (isDemo) {
          setEarnings(DEMO_EARNINGS.filter(e => e.workerId === DEMO_WORKER.id));
          setCertificateId(`FG-CERT-${Date.now().toString(36).toUpperCase()}`);
          return;
        }
        if (!user?.id) { setLoading(false); return; }
        const res = await earningsApi.get(`/earnings/${user.id}`);
        setEarnings(res.data.data?.earnings || []);
        setCertificateId(`FG-CERT-${user.id}-${Date.now().toString(36).toUpperCase()}`);
      } catch { setEarnings([]); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id, isDemo]);

  const stats = useMemo(() => {
    const verified = earnings.filter(e => e.isVerified);
    const totalNet = verified.reduce((s, e) => s + (e.amount || 0), 0);
    const totalGross = verified.reduce((s, e) => s + (e.grossEarnings || (e.amount + e.deductions) || 0), 0);
    const totalDeductions = verified.reduce((s, e) => s + (e.deductions || 0), 0);
    const dates = verified.map(e => new Date(e.date)).sort((a, b) => a - b);
    const platforms = [...new Set(verified.map(e => e.platform))];
    const totalHours = verified.reduce((s, e) => s + (e.hoursWorked || 0), 0);

    return {
      verifiedCount: verified.length, totalNet, totalGross, totalDeductions,
      startDate: dates[0], endDate: dates[dates.length - 1],
      platforms, totalHours, canGenerate: verified.length >= 1,
      avgDeductionPct: totalGross > 0 ? ((totalDeductions / totalGross) * 100).toFixed(1) : 0,
    };
  }, [earnings]);

  const workerName = isDemo ? DEMO_WORKER.name : user?.name || "Worker";
  const workerCity = isDemo ? DEMO_WORKER.city : user?.city || "Pakistan";

  const handleGenerate = async () => {
    if (!stats.canGenerate) { toast.error("Need at least 1 verified entry"); return; }
    setIsGenerating(true);
    try {
      if (!isDemo) {
        await certificateApi.post("/certificates", {
          workerId: user.id, workerName, totalEarnings: stats.totalNet,
          verifiedEntries: stats.verifiedCount, startDate: stats.startDate, endDate: stats.endDate,
        });
      }
      if (isDemo) useDemoStore.getState().advanceDemoStep();
      toast.success("Certificate generated!");
    } catch { toast.error("Failed to generate certificate"); }
    finally { setIsGenerating(false); }
  };

  const handleDownload = () => {
    const el = certRef.current;
    if (!el) return;
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true }).then(canvas => {
        const link = document.createElement("a");
        link.download = `FairGig-Certificate-${certificateId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Certificate downloaded!");
      });
    }).catch(() => toast.error("Download failed — try screenshot"));
  };

  const qrData = `${window.location.origin}/verify/${certificateId || "demo"}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  if (loading) return <div className="space-y-6"><div className="skeleton h-28 w-full" /><div className="skeleton h-96 w-full" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Income Certificate</h1>
          <p className="text-slate-500 mt-1 text-sm">Generate a verified, bank-acceptable income document</p>
        </div>
        <div className="flex gap-2">
          {certificateId && stats.canGenerate && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25 flex items-center gap-2 text-sm">
              ⬇️ Download
            </motion.button>
          )}
        </div>
      </div>

      {/* Pre-certificate stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Verified Entries", value: stats.verifiedCount, icon: "✅" },
          { label: "Total Net Income", value: pkr(stats.totalNet), icon: "💰" },
          { label: "Avg Deduction", value: `${stats.avgDeductionPct}%`, icon: "📊" },
          { label: "Platforms", value: stats.platforms.join(", ") || "—", icon: "🏢" },
        ].map((s, i) => (
          <Card key={i} className="p-3" hover={false}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.icon} {s.label}</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{s.value}</p>
          </Card>
        ))}
      </div>

      {!stats.canGenerate ? (
        <Card className="p-8 text-center" hover={false}>
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3"><span className="text-3xl">🔒</span></div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Cannot Generate Certificate</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">You need at least 1 verified earnings entry to generate a certificate. Submit earnings and wait for verification.</p>
        </Card>
      ) : (
        <>
          {/* Certificate Document */}
          <div ref={certRef} className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden print:shadow-none print:border-0">
            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none text-[18rem] font-bold text-brand-900 rotate-[-15deg] select-none">FG</div>

            {/* Double border */}
            <div className="border-[3px] border-double border-slate-300 outline outline-1 outline-offset-[6px] outline-slate-200 p-6 sm:p-10 relative">

              {/* Official Seal */}
              <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-center leading-tight uppercase text-[9px] transform -rotate-12 border-[3px] border-amber-300">
                FairGig<br />Authority<br />Seal
              </div>

              {/* Header */}
              <div className="text-center space-y-3 mb-8">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-brand-900 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-md">FG</div>
                  <div className="text-left">
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 uppercase tracking-widest">Verified Income Certificate</h2>
                    <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-semibold">Issued by FairGig Authority — Islamic Republic of Pakistan</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-4 text-center max-w-xl mx-auto mb-10">
                <p className="text-sm text-slate-600 italic">This is to certify that</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 border-b-2 border-slate-300 pb-1 inline-block px-8">{workerName}</h3>
                <p className="text-sm text-slate-600 italic">resident of <span className="font-medium text-slate-800">{workerCity}</span>, has verifiably earned a net income of</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-brand-700">{pkr(stats.totalNet)}</h3>
                <p className="text-xs text-slate-500">via authenticated platform data sources during the period</p>
                <p className="font-semibold text-slate-800 text-sm">
                  {stats.startDate ? new Date(stats.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "—"} to {stats.endDate ? new Date(stats.endDate).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </p>

                {/* Verified details */}
                <div className="grid grid-cols-3 gap-3 pt-4 text-left">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase">Verified Entries</p>
                    <p className="text-lg font-bold text-slate-800">{stats.verifiedCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase">Total Hours</p>
                    <p className="text-lg font-bold text-slate-800">{stats.totalHours}h</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase">Platforms</p>
                    <p className="text-sm font-bold text-slate-800">{stats.platforms.join(", ")}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg mx-auto">
                    This certificate serves as proof of gig-work earnings verified through the FairGig platform's anti-fraud computational matrix and human review board. This document is acceptable for bank loan applications and financial verification purposes.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-end justify-between mt-10 pt-6 border-t-2 border-slate-100">
                {/* QR Code */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center p-1.5">
                    <img src={qrUrl} alt="QR Code" className="w-full h-full" />
                  </div>
                  <p className="text-[9px] font-medium text-slate-400 mt-2 uppercase tracking-wider">Scan to Verify</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">/verify/{certificateId}</p>
                </div>

                {/* Certificate ID */}
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Certificate ID</p>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{certificateId}</p>
                </div>

                {/* Signature */}
                <div className="text-center space-y-1">
                  <div className="w-32 h-12 border-b-2 border-brand-900 mx-auto flex items-end justify-center pb-1">
                    <span className="text-2xl opacity-70" style={{ fontFamily: "'Brush Script MT', cursive" }}>F. Director</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">FairGig Authority</p>
                  <p className="text-[9px] text-slate-500">{new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button if not yet generated */}
          {!certificateId && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGenerate} disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25 disabled:opacity-50">
              {isGenerating ? "Generating..." : "Generate Certificate"}
            </motion.button>
          )}
        </>
      )}
    </motion.div>
  );
}
