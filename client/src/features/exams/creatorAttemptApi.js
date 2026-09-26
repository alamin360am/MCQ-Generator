import { apiFetch } from "../../lib/api";

export const fetchExamAnalytics = async (examId) => {
  return apiFetch(`/api/exams/${examId}/analytics`);
};

export const fetchExamAttempts = async ({
  examId,
  page = 1,
  limit = 20,
  status = "",
}) => {
  const params = new URLSearchParams();

  params.set("page", String(page));

  params.set("limit", String(limit));

  if (status) {
    params.set("status", status);
  }

  return apiFetch(`/api/exams/${examId}/attempts?${params.toString()}`);
};

export const fetchExamAttemptDetail = async ({ examId, attemptId }) => {
  return apiFetch(`/api/exams/${examId}/attempts/${attemptId}`);
};
