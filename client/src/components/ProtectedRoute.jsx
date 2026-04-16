import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 *
 * Props:
 *   allowedRoles  - array of role strings that may access this route, e.g. ["owner", "admin"]
 *                   If omitted, any authenticated user is allowed.
 *   redirectTo    - where to send unauthenticated users (default: "/login")
 *   children      - the protected JSX to render
 *
 * Behaviour:
 *   1. Not logged in  → redirect to `redirectTo`
 *   2. Logged in but wrong role → redirect to "/"  (or a dedicated 403 page)
 *   3. Logged in and correct role → render children
 */
const ProtectedRoute = ({
    children,
    allowedRoles = [],
    redirectTo = "/login"
}) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // While checking auth status, render nothing (AuthProvider already blocks flash)
    if (loading) return null;

    // Not authenticated
    if (!user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Role check — only if specific roles are required
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
