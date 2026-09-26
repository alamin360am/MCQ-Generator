import { apiFetch } from "../lib/api";

import { useAuthStore } from "../stores/authStore";

export const registerUser = async (values) => {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",

    body: JSON.stringify({
      name: values.name,
      email: values.email,
      password: values.password,
    }),

    skipAuth: true,
    skipRefresh: true,
  });

  useAuthStore.getState().setSession({
    user: data.user,

    accessToken: data.accessToken,
  });

  return data;
};

export const loginUser = async (values) => {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",

    body: JSON.stringify({
      email: values.email,

      password: values.password,
    }),

    skipAuth: true,
    skipRefresh: true,
  });

  useAuthStore.getState().setSession({
    user: data.user,

    accessToken: data.accessToken,
  });

  return data;
};

export const logoutUser = async () => {
  try {
    await apiFetch("/api/auth/logout", {
      method: "POST",

      skipRefresh: true,
    });
  } finally {
    useAuthStore.getState().clearSession();
  }
};

export const logoutAllDevices = async () => {
  try {
    await apiFetch("/api/auth/logout-all", {
      method: "POST",
    });
  } finally {
    useAuthStore.getState().clearSession();
  }
};
