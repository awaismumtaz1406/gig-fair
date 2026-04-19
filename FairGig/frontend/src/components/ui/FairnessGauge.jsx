import { memo } from "react";

const getColor = (score) => {
  if (score >= 76) return "#16A34A";
  if (score >= 51) return "#D97706";
  if (score >= 31) return "#F59E0B";
  return "#DC2626";
};

const getLabel = (score) => {
  if (score >= 76) return "Excellent";
  if (score >= 51) return "Good";
  if (score >= 31) return "Fair";
  return "Poor";
};

function FairnessGauge({ score = 0, label = "", size = 120 }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = getColor(progress);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ animation: "gauge-fill 1s ease-out forwards" }}
        />
        {/* Score text */}
        <text x={center} y={center - 4} textAnchor="middle" className="text-2xl font-bold" fill="#1e293b" style={{ fontSize: "22px", fontWeight: 700 }}>
          {progress}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fill={color} style={{ fontSize: "10px", fontWeight: 600 }}>
          {getLabel(progress)}
        </text>
      </svg>
      {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
    </div>
  );
}

export default memo(FairnessGauge);
