import { apiFetch } from "../../lib/api";

const attemptHeaders = (attemptToken) => ({
  "X-Attempt-Token": attemptToken,
});

export const startPublicAttempt = async (shareId, payload = {}) => {
  return apiFetch(`/api/public/exams/${shareId}/attempts`, {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const fetchPublicAttempt = async ({ attemptId, attemptToken }) => {
  return apiFetch(`/api/public/attempts/${attemptId}`, {
    headers: attemptHeaders(attemptToken),

    skipAuth: true,
    skipRefresh: true,
  });
};

export const savePublicAttemptAnswers = async ({
  attemptId,
  attemptToken,
  answers,
}) => {
  return apiFetch(`/api/public/attempts/${attemptId}/answers`, {
    method: "PATCH",

    headers: attemptHeaders(attemptToken),

    body: JSON.stringify({
      answers,
    }),

    skipAuth: true,
    skipRefresh: true,
  });
};

export const submitPublicAttempt = async ({ attemptId, attemptToken }) => {
  return apiFetch(`/api/public/attempts/${attemptId}/submit`, {
    method: "POST",

    headers: attemptHeaders(attemptToken),

    skipAuth: true,
    skipRefresh: true,
  });
};

export const fetchPublicAttemptResult = async ({ attemptId, attemptToken }) => {
  return apiFetch(`/api/public/attempts/${attemptId}/result`, {
    headers: attemptHeaders(attemptToken),

    skipAuth: true,
    skipRefresh: true,
  });
};
