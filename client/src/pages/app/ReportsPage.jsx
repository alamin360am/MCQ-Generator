import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  BarChart3,
  Bookmark,
  Brain,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileQuestion,
  RefreshCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import ReportRangeTabs from "../../features/reports/ReportRangeTabs";
import ReportKpiCard from "../../features/reports/ReportKpiCard";

import {
  AccuracyTrendChart,
  AnswerActivityChart,
  DifficultyChart,
  ExamPerformanceChart,
  PracticeModeChart,
  QuestionSubjectPieChart,
  SubjectPerformanceChart,
} from "../../features/reports/ReportCharts";

import {
  fetchDashboardReport,
  fetchExamReport,
  fetchLearningReport,
  fetchQuestionReport,
  getBrowserTimeZone,
} from "../../features/reports/reportApi";

import {
  formatDifficulty,
  formatNumber,
  formatPercent,
  formatRangeLabel,
  formatSourceType,
  truncateText,
} from "../../features/reports/reportUtils";

function ReportsPage() {
  const [range, setRange] = useState("30d");

  const timezone = useMemo(() => getBrowserTimeZone(), []);

  const dashboardQuery = useQuery({
    queryKey: ["reports", "dashboard", range, timezone],

    queryFn: () =>
      fetchDashboardReport({
        range,
        timezone,
      }),
  });

  const learningQuery = useQuery({
    queryKey: ["reports", "learning", range, timezone],

    queryFn: () =>
      fetchLearningReport({
        range,
        timezone,
      }),
  });

  const questionsQuery = useQuery({
    queryKey: ["reports", "questions"],

    queryFn: fetchQuestionReport,
  });

  const examsQuery = useQuery({
    queryKey: ["reports", "exams", range, timezone],

    queryFn: () =>
      fetchExamReport({
        range,
        timezone,
      }),
  });

  const loading =
    dashboardQuery.isLoading ||
    learningQuery.isLoading ||
    questionsQuery.isLoading ||
    examsQuery.isLoading;

  const error =
    dashboardQuery.error ||
    learningQuery.error ||
    questionsQuery.error ||
    examsQuery.error;

  const refreshAll = () => {
    dashboardQuery.refetch();
    learningQuery.refetch();
    questionsQuery.refetch();
    examsQuery.refetch();
  };

  if (loading) {
    return <ReportsLoading />;
  }

  if (error) {
    return <ReportsError message={error.message} onRetry={refreshAll} />;
  }

  const dashboard = dashboardQuery.data?.report || {};

  const learning = learningQuery.data?.report || {};

  const questions = questionsQuery.data?.report || {};

  const exams = examsQuery.data?.report || {};

  const practice = dashboard.practice || {};

  const questionOverview = questions.overview || dashboard.questions || {};

  const examOverview = exams.overview || {};

  return (
    <div className="space-y-8 pb-10">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={25} className="text-emerald-600" />

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Reports & Analytics
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Track learning progress, weak areas, Question Bank health and exam
            performance.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {formatRangeLabel(range)} · {timezone}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ReportRangeTabs value={range} onChange={setRange} />

          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard
          title="Accuracy"
          value={formatPercent(practice.accuracy)}
          description={`${formatNumber(practice.attempted)} answered questions`}
          icon={Target}
          accent="emerald"
        />

        <ReportKpiCard
          title="Correct Answers"
          value={formatNumber(practice.correct)}
          description="Correct practice answers"
          icon={CheckCircle2}
          accent="blue"
        />

        <ReportKpiCard
          title="Wrong Answers"
          value={formatNumber(practice.wrong)}
          description="Incorrect practice answers"
          icon={XCircle}
          accent="red"
        />

        <ReportKpiCard
          title="Needs Review"
          value={formatNumber(dashboard.questions?.needsReview)}
          description="Current unresolved wrong questions"
          icon={CircleAlert}
          accent="amber"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AccuracyTrendChart data={learning.activity || []} />

        <AnswerActivityChart data={learning.activity || []} />
      </section>

      <SectionHeader
        eyebrow="Learning"
        title="Performance Breakdown"
        description="See where you perform well and where more practice is needed."
      />

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <SubjectPerformanceChart data={learning.subjects || []} />

        <DifficultyChart data={learning.difficulty || []} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PracticeModeChart data={learning.practiceModes || []} />

        <ReviewRecoveryCard data={learning.reviewRecovery || {}} />
      </section>

      <TopicPerformanceTable topics={learning.topics || []} />

      <MostMissedQuestions questions={learning.mostMissed || []} />

      <SectionHeader
        eyebrow="Question Bank"
        title="Content Analytics"
        description="Understand the structure and coverage of your own Question Bank."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard
          title="Total Questions"
          value={formatNumber(questionOverview.total)}
          icon={FileQuestion}
          accent="violet"
        />

        <ReportKpiCard
          title="Bookmarked"
          value={formatNumber(questionOverview.bookmarked)}
          icon={Bookmark}
          accent="amber"
        />

        <ReportKpiCard
          title="Practice Sessions"
          value={formatNumber(practice.completedSessions)}
          icon={Brain}
          accent="emerald"
        />

        <ReportKpiCard
          title="Recovered"
          value={formatNumber(dashboard.questions?.recovered)}
          description="Previously wrong questions now resolved"
          icon={ClipboardCheck}
          accent="blue"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <QuestionSubjectPieChart data={questions.subjects || []} />

        <QuestionBankBreakdown questions={questions} />
      </section>

      <SectionHeader
        eyebrow="Exams"
        title="Creator Exam Analytics"
        description="Summary of exams you created and participant performance."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard
          title="Created Exams"
          value={formatNumber(examOverview.totalExams)}
          icon={Trophy}
          accent="violet"
        />

        <ReportKpiCard
          title="Published"
          value={formatNumber(examOverview.publishedExams)}
          icon={ClipboardCheck}
          accent="emerald"
        />

        <ReportKpiCard
          title="Attempts"
          value={formatNumber(examOverview.attempts)}
          icon={Brain}
          accent="blue"
        />

        <ReportKpiCard
          title="Average Score"
          value={formatPercent(examOverview.averageScore)}
          icon={Target}
          accent="amber"
        />
      </section>

      <ExamPerformanceChart data={exams.exams || []} />
    </div>
  );
}

function ReviewRecoveryCard({ data }) {
  const everWrong = Number(data.everWrong || 0);

  const recovered = Number(data.recovered || 0);

  const needsReview = Number(data.needsReview || 0);

  const recoveryRate = Number(data.recoveryRate || 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold">Wrong Question Recovery</h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        All-time review status based on questions you have answered incorrectly.
      </p>

      <div className="mt-6 flex items-center justify-center">
        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-12px border-emerald-100 dark:border-emerald-950">
          <span className="text-2xl font-bold text-emerald-600">
            {formatPercent(recoveryRate)}
          </span>

          <span className="mt-1 text-xs text-slate-400">recovered</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <MiniMetric label="Ever Wrong" value={everWrong} />

        <MiniMetric label="Recovered" value={recovered} type="success" />

        <MiniMetric label="Review" value={needsReview} type="warning" />
      </div>
    </article>
  );
}

function TopicPerformanceTable({ topics }) {
  const rows = [...topics]
    .filter((topic) => topic.attempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 12);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="font-bold">Topic Performance</h3>

        <p className="mt-1 text-xs text-slate-400">
          Lowest accuracy topics appear first.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyBlock />
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-170 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-400 dark:border-slate-800">
                <th className="pb-3 pr-4 font-semibold">Topic</th>

                <th className="pb-3 pr-4 font-semibold">Subject</th>

                <th className="pb-3 pr-4 text-right font-semibold">
                  Attempted
                </th>

                <th className="pb-3 pr-4 text-right font-semibold">Wrong</th>

                <th className="pb-3 text-right font-semibold">Accuracy</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((topic) => (
                <tr
                  key={topic.id || `${topic.subjectName}-${topic.name}`}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                >
                  <td className="py-3 pr-4 font-semibold">{topic.name}</td>

                  <td className="py-3 pr-4 text-slate-500">
                    {topic.subjectName}
                  </td>

                  <td className="py-3 pr-4 text-right">{topic.attempted}</td>

                  <td className="py-3 pr-4 text-right text-red-600">
                    {topic.wrong}
                  </td>

                  <td className="py-3 text-right font-bold">
                    <AccuracyBadge value={topic.accuracy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function MostMissedQuestions({ questions }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="font-bold">Most Missed Questions</h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Questions with the most wrong answers during the selected period.
        </p>
      </div>

      {questions.length === 0 ? (
        <EmptyBlock />
      ) : (
        <div className="mt-5 space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-sm font-bold text-red-600 dark:bg-red-950/30">
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <p className="font-semibold leading-6">
                    {truncateText(question.questionText, 150)}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{question.subjectName}</span>

                    <span>•</span>

                    <span>{formatDifficulty(question.difficulty)}</span>

                    <span>•</span>

                    <span>{question.attempts} attempts</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 sm:text-right">
                <div>
                  <p className="text-lg font-bold text-red-600">
                    {question.wrong}
                  </p>

                  <p className="text-[11px] text-slate-400">wrong</p>
                </div>

                <div>
                  <p className="text-lg font-bold">
                    {formatPercent(question.accuracy)}
                  </p>

                  <p className="text-[11px] text-slate-400">accuracy</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function QuestionBankBreakdown({ questions }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold">Question Bank Breakdown</h3>

      <p className="mt-1 text-xs text-slate-400">
        Difficulty and creation-source distribution.
      </p>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Difficulty
        </p>

        <div className="mt-3 space-y-3">
          {(questions.difficulty || []).map((item) => (
            <ProgressRow
              key={item.difficulty}
              label={formatDifficulty(item.difficulty)}
              value={item.count}
              total={questions.overview?.total || 0}
            />
          ))}
        </div>
      </div>

      <div className="mt-7">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Sources
        </p>

        <div className="mt-3 space-y-3">
          {(questions.sources || []).map((item) => (
            <ProgressRow
              key={item.source}
              label={formatSourceType(item.source)}
              value={item.count}
              total={questions.overview?.total || 0}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function ProgressRow({ label, value, total }) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="capitalize text-slate-600 dark:text-slate-300">
          {label}
        </span>

        <span className="font-semibold">{formatNumber(value)}</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function AccuracyBadge({ value }) {
  const numeric = Number(value || 0);

  let className = "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400";

  if (numeric >= 75) {
    className =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
  } else if (numeric >= 50) {
    className =
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
  }

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        className,
      ].join(" ")}
    >
      {formatPercent(numeric)}
    </span>
  );
}

function MiniMetric({ label, value, type = "default" }) {
  const styles = {
    default: "text-slate-900 dark:text-white",

    success: "text-emerald-600",

    warning: "text-amber-600",
  };

  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-950">
      <p className={["text-xl font-bold", styles[type]].join(" ")}>
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-bold">{title}</h2>

      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </section>
  );
}

function EmptyBlock() {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
      Not enough data yet.
    </div>
  );
}

function ReportsLoading() {
  return (
    <div className="space-y-5">
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

        <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function ReportsError({ message, onRetry }) {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <CircleAlert size={42} className="mx-auto text-red-500" />

      <h2 className="mt-4 text-xl font-bold">Could not load reports</h2>

      <p className="mt-2 text-sm text-slate-500">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
      >
        <RefreshCcw size={16} />
        Try Again
      </button>
    </div>
  );
}

export default ReportsPage;
