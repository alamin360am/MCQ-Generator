import { apiFetch } from "../../lib/api";

export const getBrowserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const buildReportParams = ({ range = "30d", timezone } = {}) => {
  const params = new URLSearchParams();

  params.set("range", range);

  if (timezone) {
    params.set("timezone", timezone);
  }

  return params.toString();
};

export const fetchDashboardReport = async ({
  range = "30d",
  timezone,
} = {}) => {
  const query = buildReportParams({
    range,
    timezone,
  });

  return apiFetch(`/api/reports/dashboard?${query}`);
};

export const fetchLearningReport = async ({ range = "30d", timezone } = {}) => {
  const query = buildReportParams({
    range,
    timezone,
  });

  return apiFetch(`/api/reports/learning?${query}`);
};

export const fetchQuestionReport = async () => {
  return apiFetch("/api/reports/questions");
};

export const fetchExamReport = async ({ range = "30d", timezone } = {}) => {
  const query = buildReportParams({
    range,
    timezone,
  });

  return apiFetch(`/api/reports/exams?${query}`);
};
