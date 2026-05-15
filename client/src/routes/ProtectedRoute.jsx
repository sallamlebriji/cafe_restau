import { Navigate, useLocation } from "react-router-dom";
import { hasModuleAccess } from "../constants/navigation";
import { useAuth } from "../context/AuthContext";
import { useModuleAccess } from "../hooks/useModuleAccess";

export const ProtectedRoute = ({ children, roles, moduleId }) => {
  const { user, loading } = useAuth();
  const { modules, loading: modulesLoading } = useModuleAccess(user, user?.establishmentId);
  const location = useLocation();
  const token = localStorage.getItem("token");
  if (loading || (moduleId && modulesLoading && user?.roleName !== "SUPER_ADMIN")) {
    return <div className="grid min-h-screen place-items-center bg-cream text-lg font-black text-ink">Chargement...</div>;
  }
  if (!user && !token) return <Navigate to="/login" replace />;
  if (user?.roleName === "SUPER_ADMIN") return children;
  if (moduleId && !hasModuleAccess(user?.roleName, moduleId, modules)) {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
  }
  if (roles?.length && user?.roleName && !roles.includes(user.roleName)) {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
  }
  return children;
};
