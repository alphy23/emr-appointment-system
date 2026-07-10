// Shared helper — also used later by slot generation (Step 4)
const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

module.exports = { timeToMinutes };