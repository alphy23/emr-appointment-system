const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Expects "YYYY-MM-DD", returns "Mon", "Tue", etc.
const getDayName = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
};

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const isPastDate = (dateStr) => dateStr < getTodayStr();

module.exports = { getDayName, getTodayStr, isPastDate };