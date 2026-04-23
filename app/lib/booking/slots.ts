/**
 * Generate all possible time slot start times for a given availability window.
 * Returns strings like "09:00", "09:30", "10:00", etc.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null,
): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTime = (mins: number) => {
    const h = Math.floor(mins / 60)
      .toString()
      .padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const breakS = breakStart ? toMinutes(breakStart) : null;
  const breakE = breakEnd ? toMinutes(breakEnd) : null;

  const slots: string[] = [];
  for (
    let t = start;
    t + slotDurationMinutes <= end;
    t += slotDurationMinutes
  ) {
    if (breakS !== null && breakE !== null) {
      if (t < breakE && t + slotDurationMinutes > breakS) continue;
    }
    slots.push(toTime(t));
  }
  return slots;
}

/**
 * Remove already-booked slots from the full list.
 * bookedStartTimes: array of "HH:MM" strings (from DB start_time col, truncated to 5 chars).
 */
export function filterAvailableSlots(
  allSlots: string[],
  bookedStartTimes: string[],
): string[] {
  const booked = new Set(bookedStartTimes.map((t) => t.substring(0, 5)));
  return allSlots.filter((s) => !booked.has(s));
}

/**
 * Detect visitor region from timezone string.
 * Returns 'ID', 'IN', or null if unknown.
 */
export function detectRegionFromTimezone(tz: string): "IN" | "ID" | null {
  const idZones = [
    "Asia/Jakarta",
    "Asia/Makassar",
    "Asia/Jayapura",
    "Asia/Pontianak",
  ];
  if (idZones.includes(tz)) return "ID";
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
  return null;
}
