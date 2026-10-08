import { memo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#3B6FE8", "#16A34A", "#D97706", "#8B5CF6", "#EC4899", "#14B8A6", "#F43F5E"];

function ClusterBubbleChart({ clusters = [], onClusterClick }) {
  if (!clusters.length) {
    return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No cluster data available</div>;
  }

  const data = clusters.map((c, i) => ({
    x: i + 1,
    y: c.count || 0,
    z: (c.count || 1) * 80,
    label: c.label || c.clusterLabel || `Cluster ${i + 1}`,
    count: c.count,
    platforms: c.platforms || [],
    ...c,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <XAxis dataKey="x" hide />
        <YAxis dataKey="y" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} label={{ value: "Complaints", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#94a3b8" } }} />
        <ZAxis dataKey="z" range={[120, 600]} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontFamily: "Inter" }}
          content={({ payload }) => {
            if (!payload?.[0]) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-lg text-sm">
                <p className="font-semibold text-slate-800">{d.label}</p>
                <p className="text-slate-500">{d.count} complaints</p>
                {d.platforms?.length > 0 && <p className="text-slate-400 text-xs mt-1">{d.platforms.join(", ")}</p>}
              </div>
            );
          }}
        />
        <Scatter data={data} onClick={(entry) => onClusterClick?.(entry)} style={{ cursor: onClusterClick ? "pointer" : "default" }}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default memo(ClusterBubbleChart);
