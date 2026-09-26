import { Navigate } from "react-router-dom";

import { useAuthStore } from "../../stores/authStore";

function GuestOnlyRoute({ children }) {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-500" />
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}

export default GuestOnlyRoute;
