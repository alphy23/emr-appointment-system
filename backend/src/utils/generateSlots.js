const { timeToMinutes, minutesToTime } = require("./time");

/**
 * Pure function: given sessions + breaks + slot duration,
 * returns every non-overlapping slot boundary.
 * No slot is ever generated that overlaps a break period.
 */
const generateSlots = (sessions, breaks, slotDuration) => {
  const slots = [];

  for (const session of sessions) {
    let cursor = timeToMinutes(session.startTime);
    const sessionEnd = timeToMinutes(session.endTime);

    while (cursor + slotDuration <= sessionEnd) {
      const slotStart = cursor;
      const slotEnd = cursor + slotDuration;

      const overlapsBreak = breaks.some((brk) => {
        const breakStart = timeToMinutes(brk.startTime);
        const breakEnd = timeToMinutes(brk.endTime);
        return slotStart < breakEnd && slotEnd > breakStart;
      });

      if (!overlapsBreak) {
        slots.push({
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotEnd),
        });
      }

      cursor += slotDuration;
    }
  }

  return slots;
};

module.exports = generateSlots;