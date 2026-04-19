import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { earningsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import AlertBanner from "../components/ui/AlertBanner";
import FairnessGauge from "../components/ui/FairnessGauge";
import EarningsTrendChart from "../components/charts/EarningsTrendChart";
import PlatformCompareChart from "../components/charts/PlatformCompareChart";
import SkeletonLoader from "../components/ui/SkeletonLoader";

const pkr = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const res = await earningsApi.get(`/earnings/dashboard/${user.id}`);
        setData(res.data.data);
      } catch (err) {
        console.error("Dashboard fetch failed:", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <SkeletonLoader type="card" count={4} />
        <SkeletonLoader type="chart" />
        <SkeletonLoader type="table" />
      </motion.div>
    );
  }

  const earnings = data?.earnings || [];
  const analytics = data?.analytics || {};
  const trends = analytics.commissionTrends || [];
  const platforms = analytics.platformBreakdown || [];

  const totalEarnings = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const totalHours = earnings.reduce((s, e) => s + (e.hoursWorked || 0), 0);
  const anomalyCount = earnings.filter((e) => e.anomalyScore > 30).length;

  // Build alerts from high-anomaly entries
  const alerts = earnings
    .filter((e) => e.anomalyScore > 20 && e.anomalyMessage)
    .slice(0, 3)
    .map((e) => ({
      severity: e.anomalyScore >= 60 ? "high" : e.anomalyScore >= 30 ? "medium" : "low",
      message: e.anomalyMessage,
      recommendation: `Recorded on ${new Date(e.date).toLocaleDateString("en-PK")} — ${e.platform}`,
    }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      {/* Smart Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Earnings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pkr(totalEarnings)}</p>
          <p className="text-xs text-slate-400 mt-1">{earnings.length} records</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Worker Average</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pkr(analytics.workerAvg)}</p>
          <p className="text-xs text-slate-400 mt-1">per entry</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">City Median</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pkr(analytics.cityMedian)}</p>
          <p className="text-xs text-slate-400 mt-1">{user?.city}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Hours</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-slate-400 mt-1">{anomalyCount} anomal{anomalyCount === 1 ? "y" : "ies"}</p>
        </Card>
      </div>

      {/* Fairness + City Comparison */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-1" hover={false}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Fairness Score</h3>
          <div className="flex justify-center">
            <FairnessGauge score={analytics.fairnessScore || 0} label="Overall" size={140} />
          </div>
          {analytics.insights?.length > 0 && (
            <div className="mt-4 space-y-2">
              {analytics.insights.slice(0, 3).map((insight, i) => (
                <p key={i} className="text-xs text-slate-500 flex gap-2">
                  <span className="text-brand-500">•</span> {insight}
                </p>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2" hover={false}>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Weekly Earnings Trend</h3>
          <EarningsTrendChart data={trends} />
        </Card>
      </div>

      {/* Platform Breakdown */}
      {platforms.length > 0 && (
        <Card className="p-5" hover={false}>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Platform Breakdown</h3>
          <PlatformCompareChart data={platforms} />
        </Card>
      )}

      {/* Recent Entries */}
      <Card className="p-5" hover={false}>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Platform</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Hours</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {earnings.slice(0, 10).map((e) => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 pr-4 text-slate-600">{new Date(e.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}</td>
                  <td className="py-3 pr-4 font-medium text-slate-800">{e.platform}</td>
                  <td className="py-3 pr-4 font-medium text-slate-800">{pkr(e.amount)}</td>
                  <td className="py-3 pr-4 text-slate-600">{e.hoursWorked}h</td>
                  <td className="py-3 pr-4">
                    <Badge variant={e.isVerified ? "verified" : "pending"}>
                      {e.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {e.anomalyScore > 30 ? (
                      <Badge variant={e.anomalyScore >= 60 ? "high" : "medium"}>
                        ⚠ {e.anomalyScore}
                      </Badge>
                    ) : (
                      <span className="text-emerald-500 text-xs">✓ Normal</span>
                    )}
                  </td>
                </tr>
              ))}
              {earnings.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No earnings logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
