import { ArrowRight, BrainCircuit, ImagePlus, Link2 } from "lucide-react";

import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            AI-powered MCQ platform
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            Turn study materials into interactive MCQ exams.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-400">
            Generate questions from book pages, import existing MCQs, publish
            exams and let anyone participate using a shareable link.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white"
            >
              Start Creating
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3.5 font-bold dark:border-slate-700"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3 sm:px-6 lg:px-8">
        <Feature
          icon={ImagePlus}
          title="Image to MCQ"
          description="Upload book pages and generate questions with AI."
        />

        <Feature
          icon={BrainCircuit}
          title="Smart Practice"
          description="Create reusable exams and track every attempt."
        />

        <Feature
          icon={Link2}
          title="Shareable Exams"
          description="Publish an exam and let anyone join using the link."
        />
      </section>
    </main>
  );
}

function Feature({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        <Icon size={22} />
      </div>

      <h2 className="mt-4 font-bold">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default HomePage;
