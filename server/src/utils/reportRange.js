import AppError from "./AppError.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const isValidTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format();

    return true;
  } catch {
    return false;
  }
};

export const getReportContext = (query = {}) => {
  const range = query.range || "30d";

  if (!["7d", "30d", "90d", "all"].includes(range)) {
    throw new AppError(400, "Invalid report range");
  }

  const timeZone = query.timezone || "UTC";

  if (!isValidTimeZone(timeZone)) {
    throw new AppError(400, "Invalid timezone");
  }

  const now = new Date();

  let from = null;

  if (range !== "all") {
    const days = RANGE_DAYS[range];

    from = new Date(now.getTime() - days * DAY_MS);
  }

  return {
    range,
    from,
    to: now,
    timeZone,

    bucket: range === "all" ? "month" : "day",
  };
};
