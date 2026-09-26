import { useAuthStore } from "../stores/authStore";

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/$/, "") : "";

export const getApiUrl = (path = "") => {
  return `${API_BASE_URL}${path}`;
};

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);

    this.status = status;
    this.details = details;
  }
}

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return null;
};

let refreshPromise = null;

export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(getApiUrl("/api/auth/refresh"), {
        method: "POST",

        credentials: "include",

        headers: {
          Accept: "application/json",
        },
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        useAuthStore.getState().clearSession();

        return null;
      }

      useAuthStore.getState().setSession({
        user: data.user,

        accessToken: data.accessToken,
      });

      return data.accessToken;
    } catch {
      useAuthStore.getState().clearSession();

      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const apiFetch = async (path, options = {}) => {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

  const createHeaders = (accessToken) => {
    const headers = new Headers(fetchOptions.headers || {});

    const hasBody =
      fetchOptions.body !== undefined && fetchOptions.body !== null;

    const isFormData =
      typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    headers.set("Accept", "application/json");

    if (accessToken && !skipAuth) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return headers;
  };

  const performRequest = (accessToken) => {
    return fetch(getApiUrl(path), {
      ...fetchOptions,

      headers: createHeaders(accessToken),

      credentials: "include",
    });
  };

  let accessToken = useAuthStore.getState().accessToken;

  let response = await performRequest(accessToken);

  if (response.status === 401 && !skipRefresh) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      response = await performRequest(newAccessToken);
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.message || "Something went wrong",

      response.status,

      data?.details || null,
    );
  }

  return data;
};
