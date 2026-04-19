const variants = {
  pending: "bg-slate-100 text-slate-600",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  open: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-slate-100 text-slate-500",
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
  worker: "bg-brand-50 text-brand-700",
  verifier: "bg-purple-50 text-purple-700",
  advocate: "bg-teal-50 text-teal-700",
};

export default function Badge({ variant = "pending", children, className = "" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.pending} ${className}`}>
      {children}
    </span>
  );
}
