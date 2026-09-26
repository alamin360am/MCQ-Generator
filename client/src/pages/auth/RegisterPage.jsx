import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";

import { Link, useNavigate } from "react-router-dom";

import { registerFormSchema } from "../../schemas/auth.schema";

import { registerUser } from "../../services/auth.service";

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerFormSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await registerUser(values);

      navigate("/app/dashboard", {
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
      <h1 className="text-2xl font-bold">Create your account</h1>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Start creating questions and shareable exams.
      </p>

      {errors.root && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">Name</label>

          <input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            {...register("name")}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />

          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Email</label>

          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
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
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            {...register("password")}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />

          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Confirm Password
          </label>

          <input
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            {...register("confirmPassword")}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />

          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link to="/login" className="font-bold text-emerald-600">
          Login
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
