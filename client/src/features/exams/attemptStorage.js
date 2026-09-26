const getStorageKey = (shareId) => {
  return `mcq-exam-attempt:${shareId}`;
};

export const readAttemptSession = (shareId) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(shareId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      typeof parsed?.attemptId !== "string" ||
      typeof parsed?.attemptToken !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveAttemptSession = (shareId, session) => {
  try {
    window.sessionStorage.setItem(
      getStorageKey(shareId),
      JSON.stringify(session),
    );
  } catch {
    // Exam still works even if
    // browser storage is unavailable.
  }
};

export const clearAttemptSession = (shareId) => {
  try {
    window.sessionStorage.removeItem(getStorageKey(shareId));
  } catch {
    // Ignore unavailable storage.
  }
};
