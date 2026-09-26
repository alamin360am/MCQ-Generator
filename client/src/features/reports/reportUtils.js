export const formatPercent = (value, maximumFractionDigits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return (
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits,
    }).format(number) + "%"
  );
};

export const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat(undefined).format(number);
};

export const formatRangeLabel = (range) => {
  const labels = {
    "7d": "Last 7 days",

    "30d": "Last 30 days",

    "90d": "Last 90 days",

    all: "All time",
  };

  return labels[range] || range;
};

export const formatPracticeMode = (mode) => {
  const names = {
    random: "Random",

    bookmarked: "Bookmarked",

    wrong: "Wrong Questions",

    filtered: "Custom",
  };

  return names[mode] || mode;
};

export const formatDifficulty = (difficulty) => {
  const names = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    unknown: "Unknown",
  };

  return names[difficulty] || difficulty;
};

export const formatSourceType = (source) => {
  const names = {
    manual: "Manual",

    import: "Bulk Import",

    "ai-image": "AI Image",

    "ai-text": "AI Text",
  };

  return names[source] || source;
};

export const shortPeriodLabel = (period) => {
  if (!period) {
    return "";
  }

  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");

    const date = new Date(Number(year), Number(month) - 1, 1);

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "2-digit",
    }).format(date);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [year, month, day] = period.split("-");

    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return period;
};

export const truncateText = (value, maxLength = 100) => {
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
};
