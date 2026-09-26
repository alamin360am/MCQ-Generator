import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <div>
        <p className="text-sm font-bold text-emerald-600">404</p>

        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
