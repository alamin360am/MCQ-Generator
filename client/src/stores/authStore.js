import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,

  accessToken: null,

  status: "loading",

  setSession: ({ user, accessToken }) => {
    set({
      user,
      accessToken,
      status: "authenticated",
    });
  },

  setStatus: (status) => {
    set({
      status,
    });
  },

  clearSession: () => {
    set({
      user: null,
      accessToken: null,
      status: "unauthenticated",
    });
  },
}));
