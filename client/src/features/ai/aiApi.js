import { apiFetch } from "../../lib/api";

export const uploadSourceImages = async (files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  return apiFetch("/api/ai/images", {
    method: "POST",
    body: formData,
  });
};

export const deleteSourceImage = async (imageId) => {
  return apiFetch(`/api/ai/images/${imageId}`, {
    method: "DELETE",
  });
};

export const generateImageMcqs = async (payload) => {
  return apiFetch("/api/ai/generate-mcqs", {
    method: "POST",

    body: JSON.stringify(payload),
  });
};

export const saveGeneratedImageMcqs = async (payload) => {
  return apiFetch("/api/ai/save-mcqs", {
    method: "POST",

    body: JSON.stringify(payload),
  });
};
