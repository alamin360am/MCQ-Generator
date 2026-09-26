import { apiFetch } from "../../lib/api";

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
};

export const fetchSubjects = async () => {
  return apiFetch("/api/taxonomy/subjects");
};

export const createSubject = async (name) => {
  return apiFetch("/api/taxonomy/subjects", {
    method: "POST",

    body: JSON.stringify({
      name,
    }),
  });
};

export const fetchTopics = async (subjectId = "") => {
  return apiFetch(
    `/api/taxonomy/topics${buildQueryString({
      subjectId,
    })}`,
  );
};

export const createTopic = async ({ subjectId, name }) => {
  return apiFetch("/api/taxonomy/topics", {
    method: "POST",

    body: JSON.stringify({
      subjectId,
      name,
    }),
  });
};

export const fetchQuestions = async (params = {}) => {
  return apiFetch(`/api/questions${buildQueryString(params)}`);
};

export const createQuestion = async (payload) => {
  return apiFetch("/api/questions", {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const updateQuestion = async ({ id, payload }) => {
  return apiFetch(`/api/questions/${id}`, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
};

export const deleteQuestion = async (id) => {
  return apiFetch(`/api/questions/${id}`, {
    method: "DELETE",
  });
};

export const toggleQuestionBookmark = async (id) => {
  return apiFetch(`/api/questions/${id}/bookmark`, {
    method: "PATCH",
  });
};

export const bulkImportQuestions = async (payload) => {
  return apiFetch("/api/questions/bulk-import", {
    method: "POST",

    body: JSON.stringify(payload),
  });
};
