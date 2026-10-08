import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from "recharts";
import { useDemoStore } from "../store/demoStore";
import { DEMO_EARNINGS, DEMO_COMPLAINTS } from "../data/demoData";
import { platformExploitationScore, calcDeductionPct } from "../utils/anomalyDetection";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import FairnessGauge from "../components/ui/FairnessGauge";

const pkr = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

const COLORS = { Uber: "#3B6FE8", Foodpanda: "#D97706", Fiverr: "#16A34A", Careem: "#7C3AED", Bykea: "#DC2626" };

export default function AdvocateDashboard() {
  const isDemo = useDemoStore((s) => s.isDemoMode);
  const allEarnings = DEMO_EARNINGS;
  const allComplaints = DEMO_COMPLAINTS;

  // Computed analytics from dataset
  const analytics = useMemo(() => {
    const totalEntries = allEarnings.length;
    const totalWorkers = new Set(allEarnings.map(e => e.workerId)).size;
    const flaggedEntries = allEarnings.filter(e => (e.anomalyScore || 0) > 30);
    const anomalyRate = totalEntries ? ((flaggedEntries.length / totalEntries) * 100).toFixed(1) : 0;
    const verifiedCount = allEarnings.filter(e => e.isVerified).length;
    const pendingCount = totalEntries - verifiedCount;

    // Platform exploitation scores
    const platforms = ["Uber", "Foodpanda", "Fiverr"];
    const exploitationScores = {};
    platforms.forEach(p => { const s = platformExploitationScore(allEarnings, p); if (s !== null) exploitationScores[p] = s; });

    // City-wise anomaly data
    const cities = ["Karachi", "Lahore", "Islamabad"];
    const cityAnomalies = cities.map(city => {
      const cityEntries = allEarnings.filter(e => e.city === city);
      const flagged = cityEntries.filter(e => (e.anomalyScore || 0) > 30).length;
      const avgDedPct = cityEntries.length ? cityEntries.reduce((s, e) => {
        const gross = e.grossEarnings || (e.amount + e.deductions) || 1;
        return s + calcDeductionPct(gross, e.deductions || 0);
      }, 0) / cityEntries.length : 0;
      return { city, total: cityEntries.length, flagged, anomalyRate: cityEntries.length ? ((flagged / cityEntries.length) * 100).toFixed(1) : 0, avgDedPct: avgDedPct.toFixed(1) };
    });

    // Median earnings per platform
    const medianEarnings = platforms.map(p => {
      const pEntries = allEarnings.filter(e => e.platform === p);
      const sorted = pEntries.map(e => e.amount || 0).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length ? sorted[mid] : 0;
      const avgGross = pEntries.length ? pEntries.reduce((s, e) => s + (e.grossEarnings || (e.amount + e.deductions) || 0), 0) / pEntries.length : 0;
      return { platform: p, net: Math.round(median), gross: Math.round(avgGross) };
    });

    // Fairness radar data
    const fairnessData = platforms.map(p => {
      const pEntries = allEarnings.filter(e => e.platform === p);
      const avgDedPct = pEntries.length ? pEntries.reduce((s, e) => {
        const gross = e.grossEarnings || (e.amount + e.deductions) || 1;
        return s + calcDeductionPct(gross, e.deductions || 0);
      }, 0) / pEntries.length : 0;
      const anomalyPct = pEntries.length ? (pEntries.filter(e => (e.anomalyScore || 0) > 30).length / pEntries.length) * 100 : 0;
      const stability = Math.max(0, 100 - anomalyPct);
      return { platform: p, deduction: Math.round(avgDedPct * 2.5), stability: Math.round(stability), anomaly: Math.round(anomalyPct * 1.5) };
    });

    // Complaint type breakdown
    const complaintTypes = {};
    allComplaints.forEach(c => { complaintTypes[c.type] = (complaintTypes[c.type] || 0) + 1; });
    const complaintPieData = Object.entries(complaintTypes).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Overall fairness score
    const overallScore = Math.round(
      (verifiedCount / Math.max(totalEntries, 1)) * 40 +
      Math.max(0, 30 - (flaggedEntries.length / Math.max(totalEntries, 1)) * 100) +
      (allComplaints.filter(c => c.status === "resolved").length / Math.max(allComplaints.length, 1)) * 30
    );

    return {
      totalEntries, totalWorkers, flaggedEntries: flaggedEntries.length, anomalyRate,
      verifiedCount, pendingCount, exploitationScores, cityAnomalies,
      medianEarnings, fairnessData, complaintPieData, overallScore,
      openComplaints: allComplaints.filter(c => c.status === "open").length,
      resolvedComplaints: allComplaints.filter(c => c.status === "resolved").length,
    };
  }, [allEarnings, allComplaints]);

  const a = analytics;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Advocate Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">System-wide analytics, anomaly monitoring, and fairness scoring</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 italic">Based on anonymized worker submissions</span>
          <FairnessGauge score={a.overallScore} />
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Flagged Entries", value: a.flaggedEntries, sub: `${a.anomalyRate}% anomaly rate`, icon: "🔥", gradient: "from-red-500 to-red-600" },
          { label: "Highest Deduction", value: `${Math.round(Math.max(...Object.values(a.exploitationScores), 0))}%`, sub: "Platform exploitation", icon: "📉", gradient: "from-amber-500 to-amber-600" },
          { label: "Resolved Cases", value: a.resolvedComplaints, sub: `${a.openComplaints} still open`, icon: "🛡️", gradient: "from-emerald-500 to-emerald-600" },
          { label: "Total Workers", value: a.totalWorkers, sub: `${a.totalEntries} entries tracked`, icon: "👥", gradient: "from-brand-500 to-brand-600" },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`p-4 bg-gradient-to-br ${m.gradient} text-white`} hover={false}>
              <div className="flex items-center gap-2 mb-1"><span className="text-lg">{m.icon}</span><p className="text-[10px] font-medium text-white/70 uppercase tracking-wide">{m.label}</p></div>
              <p className="text-2xl font-black">{m.value}</p>
              <p className="text-[11px] text-white/70 mt-0.5">{m.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Platform Exploitation Scores */}
      <Card className="p-5" hover={false}>
        <h3 className="text-base font-semibold text-slate-700 mb-4">Platform Exploitation Scores</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {Object.entries(a.exploitationScores).map(([platform, score]) => (
            <div key={platform} className="p-4 rounded-xl border border-slate-200 bg-white/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800 text-sm">{platform}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${score >= 60 ? "bg-red-100 text-red-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full" style={{ backgroundColor: COLORS[platform] || "#3B6FE8" }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">{score >= 60 ? "High exploitation risk" : score >= 40 ? "Moderate concerns" : "Relatively fair"}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fairness Radar */}
        <Card className="p-5" hover={false}>
          <h3 className="text-base font-semibold text-slate-700 mb-4">Platform Fairness Matrix</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={a.fairnessData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="platform" tick={{ fill: "#475569", fontSize: 12, fontWeight: "bold" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Radar name="Deduction" dataKey="deduction" stroke="#3B6FE8" fill="#3B6FE8" fillOpacity={0.2} />
              <Radar name="Stability" dataKey="stability" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} />
              <Radar name="Anomaly" dataKey="anomaly" stroke="#D97706" fill="#D97706" fillOpacity={0.2} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Median Earnings */}
        <Card className="p-5" hover={false}>
          <h3 className="text-base font-semibold text-slate-700 mb-4">Median Earnings by Platform (PKR)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={a.medianEarnings} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="platform" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontWeight: "bold", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v) => pkr(v)} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
              <Bar dataKey="gross" name="Gross" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net" fill="#3B6FE8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* City-wise Anomaly Spikes + Complaint Breakdown */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* City Anomaly Table */}
        <Card className="lg:col-span-3 p-5" hover={false}>
          <h3 className="text-base font-semibold text-slate-700 mb-4">City-wise Anomaly Spikes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="pb-2.5 pr-3">City</th><th className="pb-2.5 pr-3">Entries</th><th className="pb-2.5 pr-3">Flagged</th><th className="pb-2.5 pr-3">Anomaly Rate</th><th className="pb-2.5 pr-3">Avg Deduction</th><th className="pb-2.5">Severity</th>
                </tr>
              </thead>
              <tbody>
                {a.cityAnomalies.map(c => (
                  <tr key={c.city} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-3 font-medium text-slate-800">{c.city}</td>
                    <td className="py-3 pr-3 text-slate-600">{c.total}</td>
                    <td className="py-3 pr-3 text-slate-600">{c.flagged}</td>
                    <td className="py-3 pr-3"><span className={`font-bold ${Number(c.anomalyRate) > 30 ? "text-red-600" : Number(c.anomalyRate) > 15 ? "text-amber-600" : "text-emerald-600"}`}>{c.anomalyRate}%</span></td>
                    <td className="py-3 pr-3 text-slate-600">{c.avgDedPct}%</td>
                    <td className="py-3"><Badge variant={Number(c.anomalyRate) > 30 ? "high" : Number(c.anomalyRate) > 15 ? "medium" : "low"}>{Number(c.anomalyRate) > 30 ? "Critical" : Number(c.anomalyRate) > 15 ? "Warning" : "Normal"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Complaint Type Pie */}
        <Card className="lg:col-span-2 p-5" hover={false}>
          <h3 className="text-base font-semibold text-slate-700 mb-4">Complaint Breakdown</h3>
          {a.complaintPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={a.complaintPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {a.complaintPieData.map((_, i) => <Cell key={i} fill={["#3B6FE8", "#D97706", "#16A34A", "#DC2626", "#7C3AED"][i % 5]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No complaints data</div>}
          <div className="flex flex-wrap gap-2 mt-2">
            {a.complaintPieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#3B6FE8", "#D97706", "#16A34A", "#DC2626", "#7C3AED"][i % 5] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Data disclaimer */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
        <p className="text-[10px] text-slate-500">📊 Based on anonymized worker submissions across {a.totalWorkers} workers and {a.totalEntries} entries. Data updated in real-time as new entries are verified.</p>
      </div>
    </motion.div>
  );
}
