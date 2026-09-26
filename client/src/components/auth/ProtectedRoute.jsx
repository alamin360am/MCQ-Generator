import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../../stores/authStore";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-500" />

          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading MCQ Generator...
          </p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
