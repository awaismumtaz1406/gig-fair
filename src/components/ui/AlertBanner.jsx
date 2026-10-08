import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const severityStyles = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low: "bg-blue-50 border-blue-200 text-blue-800",
};

const severityIcons = {
  high: "🚨",
  medium: "⚠️",
  low: "ℹ️",
};

export default function AlertBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState(new Set());

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  const dismiss = (index) => setDismissed((prev) => new Set([...prev, index]));

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((alert, i) =>
          dismissed.has(i) ? null : (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${severityStyles[alert.severity] || severityStyles.low}`}
            >
              <span className="text-lg flex-shrink-0">{severityIcons[alert.severity] || "ℹ️"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message || alert.anomalyMessage || alert.explanation}</p>
                {alert.recommendation && (
                  <p className="text-xs mt-1 opacity-75">{alert.recommendation}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(i)}
                className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none cursor-pointer flex-shrink-0"
              >
                ×
              </button>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
