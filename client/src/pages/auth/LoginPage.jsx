import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginFormSchema } from "../../schemas/auth.schema";

import { loginUser } from "../../services/auth.service";

function LoginPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const {
    register,
    handleSubmit,
    setError,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginFormSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await loginUser(values);

      const destination = location.state?.from?.pathname || "/app/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      setError("root", {
        message: error.message,
      });
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Welcome back
      </h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Login to manage your questions and exams.
      </p>

      {errors.root && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">Email</label>

          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />

          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Password</label>

          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />

          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/register" className="font-bold text-emerald-600">
          Create account
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
