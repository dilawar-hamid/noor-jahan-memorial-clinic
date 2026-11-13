import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.js";

// Usage:
//   <Route element={<ProtectedRoute />}>                       -> any logged-in user
//   <Route element={<ProtectedRoute allowedRoles={["owner"]} />}> -> owner only
function ProtectedRoute({ allowedRoles }) {
  const { user, role } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
