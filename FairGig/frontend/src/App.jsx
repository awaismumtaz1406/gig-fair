import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EarningsLogger from "./pages/EarningsLogger";
import VerificationPanel from "./pages/VerificationPanel";
import GrievanceBoard from "./pages/GrievanceBoard";
import AdvocateDashboard from "./pages/AdvocateDashboard";
import CertificatePage from "./pages/CertificatePage";

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) {
    const fallback =
      user?.role === "verifier" ? "/verify" : user?.role === "advocate" ? "/advocate" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute roles={["worker"]}><Dashboard /></PrivateRoute>} />
      <Route path="/earnings" element={<PrivateRoute roles={["worker"]}><EarningsLogger /></PrivateRoute>} />
      <Route path="/verify" element={<PrivateRoute roles={["verifier"]}><VerificationPanel /></PrivateRoute>} />
      <Route path="/grievance" element={<PrivateRoute roles={["worker", "advocate"]}><GrievanceBoard /></PrivateRoute>} />
      <Route path="/advocate" element={<PrivateRoute roles={["advocate"]}><AdvocateDashboard /></PrivateRoute>} />
      <Route path="/certificate" element={<PrivateRoute roles={["worker", "verifier"]}><CertificatePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
