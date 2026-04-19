export function SkeletonCard({ className = "" }) {
  return <div className={`skeleton h-28 w-full ${className}`} />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      <div className="skeleton h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "" }) {
  return <div className={`skeleton h-64 w-full ${className}`} />;
}

export default function SkeletonLoader({ type = "card", count = 1, ...props }) {
  const Component = type === "table" ? SkeletonTable : type === "chart" ? SkeletonChart : SkeletonCard;
  if (count === 1) return <Component {...props} />;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} {...props} />
      ))}
    </div>
  );
}
