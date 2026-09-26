const STORAGE_KEY = "mcq-active-practice-session";

export const readPracticeSessionId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

export const savePracticeSessionId = (sessionId) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, sessionId);
  } catch {
    // Practice still works
    // without browser storage.
  }
};

export const clearPracticeSessionId = () => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable
    // browser storage.
  }
};
