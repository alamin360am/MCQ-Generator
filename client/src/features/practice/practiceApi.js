import { apiFetch } from "../../lib/api";

export const startPractice = async (payload) => {
  return apiFetch("/api/practice/sessions", {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const fetchPracticeSession = async (sessionId) => {
  return apiFetch(`/api/practice/sessions/${sessionId}`);
};

export const savePracticeAnswers = async ({ sessionId, answers }) => {
  return apiFetch(`/api/practice/sessions/${sessionId}/answers`, {
    method: "PATCH",

    body: JSON.stringify({
      answers,
    }),
  });
};

export const submitPractice = async (sessionId) => {
  return apiFetch(`/api/practice/sessions/${sessionId}/submit`, {
    method: "POST",
  });
};

export const fetchPracticeHistory = async ({
  page = 1,
  limit = 20,
  status = "",
} = {}) => {
  const params = new URLSearchParams();

  params.set("page", String(page));

  params.set("limit", String(limit));

  if (status) {
    params.set("status", status);
  }

  return apiFetch(`/api/practice/history?${params.toString()}`);
};

export const fetchPracticeStats = async () => {
  return apiFetch("/api/practice/stats");
};
