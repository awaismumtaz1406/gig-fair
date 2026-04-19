import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const menuByRole = {
  worker: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/earnings", label: "Earnings", icon: "💰" },
    { to: "/grievance", label: "Complaints", icon: "📝" },
    { to: "/certificate", label: "Certificate", icon: "📄" },
  ],
  verifier: [
    { to: "/verify", label: "Verify Earnings", icon: "✅" },
    { to: "/certificate", label: "Certificates", icon: "📄" },
  ],
  advocate: [
    { to: "/advocate", label: "Dashboard", icon: "📊" },
    { to: "/grievance", label: "Grievances", icon: "📝" },
  ],
};

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const items = menuByRole[user?.role] || menuByRole.worker;

  return (
    <aside className="w-60 bg-brand-900 text-white flex-shrink-0 flex flex-col min-h-0">
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0] || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/40">{user?.city}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
