import { memo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const pkr = (v) => `PKR ${Number(v || 0).toLocaleString("en-PK")}`;

function EarningsTrendChart({ data = [] }) {
  if (!data.length) {
    return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No trend data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B6FE8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B6FE8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontFamily: "Inter" }}
          formatter={(value) => [pkr(value), "Total"]}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Area type="monotone" dataKey="total" stroke="#3B6FE8" strokeWidth={2.5} fill="url(#colorTotal)" />
        {data[0]?.avg !== undefined && (
          <Area type="monotone" dataKey="avg" stroke="#16A34A" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default memo(EarningsTrendChart);
