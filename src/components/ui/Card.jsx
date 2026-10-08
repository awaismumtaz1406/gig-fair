import { motion } from "framer-motion";

export default function Card({ children, className = "", hover = true, ...props }) {
  const base = "bg-card rounded-xl shadow-card overflow-hidden";
  if (!hover) return <div className={`${base} ${className}`} {...props}>{children}</div>;
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
      transition={{ duration: 0.15 }}
      className={`${base} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
