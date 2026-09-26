import { apiFetch } from "../../lib/api";

export const fetchExams = async (status = "") => {
  const searchParams = new URLSearchParams();

  if (status) {
    searchParams.set("status", status);
  }

  const query = searchParams.toString();

  return apiFetch(`/api/exams${query ? `?${query}` : ""}`);
};

export const fetchExam = async (id) => {
  return apiFetch(`/api/exams/${id}`);
};

export const createExam = async (payload) => {
  return apiFetch("/api/exams", {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const updateExam = async ({ id, payload }) => {
  return apiFetch(`/api/exams/${id}`, {
    method: "PATCH",

    body: JSON.stringify(payload),
  });
};

export const publishExam = async (id) => {
  return apiFetch(`/api/exams/${id}/publish`, {
    method: "POST",
  });
};

export const archiveExam = async (id) => {
  return apiFetch(`/api/exams/${id}/archive`, {
    method: "PATCH",
  });
};

export const deleteExam = async (id) => {
  return apiFetch(`/api/exams/${id}`, {
    method: "DELETE",
  });
};

export const fetchPublicExam = async (shareId) => {
  return apiFetch(`/api/public/exams/${shareId}`, {
    skipAuth: true,
    skipRefresh: true,
  });
};
