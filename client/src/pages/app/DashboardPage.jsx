import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  CircleAlert,
  FilePlus2,
  FileQuestion,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ReportKpiCard from "../../features/reports/ReportKpiCard";

import {
  fetchDashboardReport,
  fetchExamReport,
  fetchLearningReport,
  getBrowserTimeZone,
} from "../../features/reports/reportApi";

import { fetchPracticeHistory } from "../../features/practice/practiceApi";

import {
  formatNumber,
  formatPercent,
  formatPracticeMode,
  shortPeriodLabel,
} from "../../features/reports/reportUtils";

function DashboardPage() {
  const timezone = useMemo(() => getBrowserTimeZone(), []);

  const dashboardQuery = useQuery({
    queryKey: ["reports", "dashboard", "30d", timezone],

    queryFn: () =>
      fetchDashboardReport({
        range: "30d",
        timezone,
      }),
  });

  const learningQuery = useQuery({
    queryKey: ["reports", "learning", "30d", timezone],

    queryFn: () =>
      fetchLearningReport({
        range: "30d",
        timezone,
      }),
  });

  const practiceHistoryQuery = useQuery({
    queryKey: ["dashboard", "recent-practice"],

    queryFn: () =>
      fetchPracticeHistory({
        page: 1,
        limit: 5,
        status: "submitted",
      }),
  });

  const examsQuery = useQuery({
    queryKey: ["reports", "exams", "30d", timezone],

    queryFn: () =>
      fetchExamReport({
        range: "30d",
        timezone,
      }),
  });

  const loading =
    dashboardQuery.isLoading ||
    learningQuery.isLoading ||
    practiceHistoryQuery.isLoading ||
    examsQuery.isLoading;

  const error =
    dashboardQuery.error ||
    learningQuery.error ||
    practiceHistoryQuery.error ||
    examsQuery.error;

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return <DashboardError message={error.message} />;
  }

  const dashboard = dashboardQuery.data?.report || {};

  const learning = learningQuery.data?.report || {};

  const recentSessions = practiceHistoryQuery.data?.sessions || [];

  const exams = examsQuery.data?.report || {};

  const practice = dashboard.practice || {};

  const questions = dashboard.questions || {};

  const examOverview = exams.overview || {};

  return (
    <div className="space-y-8 pb-10">
      <WelcomeSection />

      <QuickActions />

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Last 30 Days
            </p>

            <h2 className="mt-1 text-xl font-bold">Learning Overview</h2>
          </div>

          <Link
            to="/app/reports"
            className="hidden items-center gap-1 text-sm font-semibold text-emerald-600 sm:inline-flex"
          >
            Full Reports
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ReportKpiCard
            title="Accuracy"
            value={formatPercent(practice.accuracy)}
            description={`${formatNumber(practice.attempted)} answered`}
            icon={Target}
            accent="emerald"
          />

          <ReportKpiCard
            title="Correct"
            value={formatNumber(practice.correct)}
            description="Correct answers"
            icon={CheckCircle2}
            accent="blue"
          />

          <ReportKpiCard
            title="Wrong"
            value={formatNumber(practice.wrong)}
            description="Incorrect answers"
            icon={XCircle}
            accent="red"
          />

          <ReportKpiCard
            title="Needs Review"
            value={formatNumber(questions.needsReview)}
            description="Unresolved wrong questions"
            icon={CircleAlert}
            accent="amber"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <DashboardAccuracyChart data={learning.activity || []} />

        <ReviewStatusCard
          questions={questions}
          recovery={learning.reviewRecovery || {}}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RecentPracticeCard sessions={recentSessions} />

        <TopExamCard exams={exams.exams || []} overview={examOverview} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SimpleStatCard
          title="Total Questions"
          value={questions.total}
          icon={FileQuestion}
        />

        <SimpleStatCard
          title="Bookmarked"
          value={questions.bookmarked}
          icon={BookOpenCheck}
        />

        <SimpleStatCard
          title="Practice Sessions"
          value={practice.completedSessions}
          icon={Brain}
        />

        <SimpleStatCard
          title="Created Exams"
          value={examOverview.totalExams ?? dashboard.exams?.created}
          icon={Trophy}
        />
      </section>

      <Link
        to="/app/reports"
        className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5 text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        <div>
          <div className="flex items-center gap-2 font-bold">
            <BarChart3 size={19} />
            View Full Analytics
          </div>

          <p className="mt-1 text-sm text-slate-300 dark:text-emerald-50">
            Explore subjects, topics, difficulty, Question Bank and exam
            reports.
          </p>
        </div>

        <ArrowRight size={21} className="shrink-0" />
      </Link>
    </div>
  );
}

function WelcomeSection() {
  const hour = new Date().getHours();

  let greeting = "Welcome back";

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning";
  } else if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon";
  } else if (hour >= 18) {
    greeting = "Good evening";
  }

  return (
    <section>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {greeting}
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Continue practicing, review mistakes and keep track of your progress.
      </p>
    </section>
  );
}

function QuickActions() {
  const actions = [
    {
      title: "Start Practice",

      description: "Random, wrong or custom practice",

      to: "/app/practice",

      icon: Brain,

      accent:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    },

    {
      title: "Create",

      description: "Add questions or build content",

      to: "/app/create",

      icon: FilePlus2,

      accent: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    },

    {
      title: "Question Bank",

      description: "Browse and manage questions",

      to: "/app/questions",

      icon: FileQuestion,

      accent:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    },

    {
      title: "Reports",

      description: "Explore detailed analytics",

      to: "/app/reports",

      icon: BarChart3,

      accent:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map(({ title, description, to, icon: Icon, accent }) => (
        <Link
          key={title}
          to={to}
          className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <div
            className={[
              "flex h-10 w-10 items-center justify-center rounded-xl",
              accent,
            ].join(" ")}
          >
            <Icon size={19} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="font-bold">{title}</h3>

            <ArrowRight
              size={16}
              className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
            />
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </Link>
      ))}
    </section>
  );
}

function DashboardAccuracyChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,

    label: shortPeriodLabel(item.period),
  }));

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">Accuracy Trend</h3>

          <p className="mt-1 text-xs text-slate-400">
            Practice accuracy over the last 30 days.
          </p>
        </div>

        <Link
          to="/app/reports"
          className="text-xs font-semibold text-emerald-600"
        >
          Details
        </Link>
      </div>

      {chartData.length === 0 ? (
        <EmptyState text="Complete some practice sessions to see your trend." />
      ) : (
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                width={38}
                tick={{
                  fontSize: 11,
                }}
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) => [formatPercent(value), "Accuracy"]}
                contentStyle={{
                  borderRadius: "12px",

                  border: "1px solid #e2e8f0",
                }}
              />

              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

function ReviewStatusCard({ questions, recovery }) {
  const needsReview = Number(questions.needsReview || 0);

  const recovered = Number(recovery.recovered || questions.recovered || 0);

  const everWrong = Number(recovery.everWrong || 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold">Review Status</h3>

      <p className="mt-1 text-xs text-slate-400">
        Current all-time wrong-question status.
      </p>

      <div className="mt-6 rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-amber-600">
              {formatNumber(needsReview)}
            </p>

            <p className="mt-1 text-sm font-semibold">Needs Review</p>
          </div>

          <CircleAlert size={34} className="text-amber-500" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-xl font-bold text-emerald-600">
            {formatNumber(recovered)}
          </p>

          <p className="mt-1 text-xs text-slate-400">Recovered</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-xl font-bold">{formatNumber(everWrong)}</p>

          <p className="mt-1 text-xs text-slate-400">Ever Wrong</p>
        </div>
      </div>

      <Link
        to="/app/practice?mode=wrong"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
      >
        <RotateCcw size={16} />
        Practice Wrong Questions
      </Link>
    </article>
  );
}

function RecentPracticeCard({ sessions }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">Recent Practice</h3>

          <p className="mt-1 text-xs text-slate-400">
            Your latest completed sessions.
          </p>
        </div>

        <Link
          to="/app/practice/history"
          className="text-xs font-semibold text-emerald-600"
        >
          View all
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState text="No completed practice sessions yet." />
      ) : (
        <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {formatPracticeMode(session.mode)}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {session.result?.correct ?? 0}/
                  {session.result?.total ?? session.questionCount} correct
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-emerald-600">
                  {formatPercent(session.result?.percentage)}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  {session.questionCount} questions
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function TopExamCard({ exams, overview }) {
  const rows = [...exams].filter((exam) => exam.attempts > 0).slice(0, 5);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">Exam Performance</h3>

          <p className="mt-1 text-xs text-slate-400">
            Most attempted exams in the last 30 days.
          </p>
        </div>

        <Link
          to="/app/reports"
          className="text-xs font-semibold text-emerald-600"
        >
          Analytics
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-xl font-bold">{formatNumber(overview.attempts)}</p>

          <p className="mt-1 text-xs text-slate-400">Attempts</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
          <p className="text-xl font-bold text-emerald-600">
            {formatPercent(overview.averageScore)}
          </p>

          <p className="mt-1 text-xs text-slate-400">Avg. Score</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState text="No completed exam attempts in this period." />
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((exam) => (
            <div
              key={exam.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{exam.title}</p>

                <p className="mt-1 text-xs text-slate-400">
                  {exam.attempts} attempts
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                {formatPercent(exam.averageScore)}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function SimpleStatCard({ title, value, icon: Icon }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={20} />
      </div>

      <div>
        <p className="text-xl font-bold">{formatNumber(value)}</p>

        <p className="text-xs text-slate-400">{title}</p>
      </div>
    </article>
  );
}

function EmptyState({ text }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
      {text}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function DashboardError({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
      <CircleAlert size={38} className="mx-auto text-red-500" />

      <h2 className="mt-4 text-xl font-bold">Dashboard could not be loaded</h2>

      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default DashboardPage;
