import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatDifficulty,
  formatPercent,
  formatPracticeMode,
  shortPeriodLabel,
} from "./reportUtils";

const chartColors = {
  emerald: "#10b981",
  red: "#ef4444",
  amber: "#f59e0b",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  slate: "#64748b",
};

const pieColors = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#64748b",
];

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "rgba(255,255,255,0.98)",
};

export function AccuracyTrendChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,

    label: shortPeriodLabel(item.period),
  }));

  return (
    <ChartShell
      title="Accuracy Trend"
      description="How your practice accuracy changes over time."
    >
      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
              width={42}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatPercent(value), "Accuracy"]}
            />

            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy"
              stroke={chartColors.emerald}
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
      )}
    </ChartShell>
  );
}

export function AnswerActivityChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,

    label: shortPeriodLabel(item.period),
  }));

  return (
    <ChartShell
      title="Answer Activity"
      description="Correct, wrong and skipped answers over time."
    >
      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip contentStyle={tooltipStyle} />

            <Legend />

            <Bar
              dataKey="correct"
              name="Correct"
              stackId="answers"
              fill={chartColors.emerald}
              radius={[0, 0, 4, 4]}
            />

            <Bar
              dataKey="wrong"
              name="Wrong"
              stackId="answers"
              fill={chartColors.red}
            />

            <Bar
              dataKey="skipped"
              name="Skipped"
              stackId="answers"
              fill={chartColors.amber}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function SubjectPerformanceChart({ data }) {
  const chartData = data
    .filter((item) => item.attempted > 0)
    .sort((a, b) => b.attempted - a.attempted)
    .slice(0, 12);

  return (
    <ChartShell
      title="Subject Performance"
      description="Accuracy across your most practiced subjects."
    >
      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(320, chartData.length * 42)}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              left: 12,
              right: 24,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e2e8f0"
            />

            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatPercent(value), "Accuracy"]}
            />

            <Bar
              dataKey="accuracy"
              name="Accuracy"
              fill={chartColors.emerald}
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function DifficultyChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,

    label: formatDifficulty(item.difficulty),
  }));

  return (
    <ChartShell
      title="Difficulty Performance"
      description="Accuracy by question difficulty."
    >
      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis dataKey="label" axisLine={false} tickLine={false} />

            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatPercent(value), "Accuracy"]}
            />

            <Bar
              dataKey="accuracy"
              fill={chartColors.violet}
              radius={[7, 7, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function PracticeModeChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,

    label: formatPracticeMode(item.mode),
  }));

  return (
    <ChartShell
      title="Practice Modes"
      description="Compare your performance across practice types."
    >
      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

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
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatPercent(value), "Accuracy"]}
            />

            <Bar
              dataKey="accuracy"
              fill={chartColors.blue}
              radius={[7, 7, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function QuestionSubjectPieChart({ data }) {
  const chartData = data.filter((item) => item.count > 0).slice(0, 8);

  return (
    <ChartShell
      title="Question Distribution"
      description="How your Question Bank is distributed by subject."
    >
      {chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((item, index) => (
                <Cell
                  key={item.id || item.name}
                  fill={pieColors[index % pieColors.length]}
                />
              ))}
            </Pie>

            <Tooltip contentStyle={tooltipStyle} />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function ExamPerformanceChart({ data }) {
  const chartData = data.filter((item) => item.attempts > 0).slice(0, 10);

  return (
    <ChartShell
      title="Exam Performance"
      description="Average participant score across your most attempted exams."
    >
      {chartData.length === 0 ? (
        <ChartEmpty message="No completed exam attempts in this period." />
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(300, chartData.length * 44)}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              left: 10,
              right: 24,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e2e8f0"
            />

            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="title"
              width={130}
              tick={{
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                if (name === "Average Score") {
                  return [formatPercent(value), name];
                }

                return [value, name];
              }}
            />

            <Bar
              dataKey="averageScore"
              name="Average Score"
              fill={chartColors.cyan}
              radius={[0, 7, 7, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function ChartShell({ title, description, children }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="font-bold">{title}</h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        )}
      </div>

      <div className="mt-5 min-w-0">{children}</div>
    </article>
  );
}

export function ChartEmpty({ message = "Not enough data yet." }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
      {message}
    </div>
  );
}
