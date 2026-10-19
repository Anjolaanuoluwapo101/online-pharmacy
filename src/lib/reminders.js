/*
  Reminder engine — turns a prescription into a real, per-dose schedule.

  A reminder is one medicine with a dose schedule (times of day). Each dose can
  be taken or un-taken individually, snoozed to a later time, and adherence is
  computed over any window.
*/

export const DAY_MS = 86400000;

/* Default clinic-style slots per frequency. */
const SLOTS = {
  "once daily": ["08:00"],
  "twice daily": ["08:00", "20:00"],
  "thrice daily": ["08:00", "14:00", "20:00"],
  "every 6 hours": ["00:00", "06:00", "12:00", "18:00"],
  "every 8 hours": ["00:00", "08:00", "16:00"],
  "every 12 hours": ["08:00", "20:00"],
  "as needed": [],
};

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const shift = (hhmm, mins) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + mins + 1440 * 3) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * Dose times for a reminder. Instructions refine the default slots:
 *  - "bedtime"  -> a single 22:00 dose
 *  - "before food" -> the first dose moves to 07:00
 */
export function scheduleFor(reminder) {
  if (!reminder) return [];
  const freq = (reminder.frequency || "").toLowerCase();
  const instructions = (reminder.instructions || "").toLowerCase();

  if (instructions.includes("bedtime")) return ["22:00"];

  let slots = SLOTS[freq];
  if (!slots) {
    // fall back on the recorded doses-per-day
    const n = Number(reminder.times_per_day) || 1;
    slots = n === 4 ? SLOTS["every 6 hours"] : n === 3 ? SLOTS["thrice daily"] : n === 2 ? SLOTS["twice daily"] : SLOTS["once daily"];
  }
  if (instructions.includes("before food")) slots = [shift(slots[0], -60), ...slots.slice(1)];
  return slots;
}

export const isActive = (r, key = dayKey()) => {
  if (!r || r.status === "removed") return false;
  if (r.start_date && key < r.start_date) return false;
  if (r.end_date && key > r.end_date) return false;
  return true;
};

/** Every dose due today, sorted by time, flagged taken or not. */
export function todaysDoses(reminders, now = new Date()) {
  const key = dayKey(now);
  const list = [];
  (reminders || []).forEach((r) => {
    if (!isActive(r, key)) return;
    scheduleFor(r).forEach((time) => {
      const at = new Date(`${key}T${time}`);
      const snoozedTo = r.snoozedUntil && new Date(r.snoozedUntil) > at ? new Date(r.snoozedUntil) : null;
      list.push({
        reminder: r,
        time,
        key,
        at: snoozedTo || at,
        snoozed: !!snoozedTo,
        taken: !!((r.taken || {})[key] || []).includes(time),
      });
    });
  });
  return list.sort((a, b) => a.at - b.at);
}

/**
 * Group today's doses by time slot, so a timestamp is shown once per
 * slot instead of once per medicine.
 */
export function groupByTime(doses) {
  const map = new Map();
  (doses || []).forEach((d) => {
    if (!map.has(d.time)) map.set(d.time, []);
    map.get(d.time).push(d);
  });
  return [...map.entries()]
    .map(([time, items]) => ({ time, doses: items, at: items[0]?.at }))
    .sort((a, b) => a.at - b.at);
}

/** The next dose that has not been taken yet. */
export function nextDose(reminders, now = new Date()) {
  const upcoming = [];
  (reminders || []).forEach((r) => {
    if (!r || r.status === "removed") return;
    scheduleFor(r).forEach((time) => {
      const at = new Date(`${dayKey(now)}T${time}`);
      if (at <= now) at.setDate(at.getDate() + 1);
      if (r.snoozedUntil) {
        const s = new Date(r.snoozedUntil);
        if (s > now && s < at) at.setTime(s.getTime());
      }
      if (r.end_date && at > new Date(`${r.end_date}T23:59:59`)) return;
      if (r.start_date && at < new Date(`${r.start_date}T00:00:00`)) return;
      upcoming.push({ reminder: r, time, at });
    });
  });
  upcoming.sort((a, b) => a.at - b.at);
  return upcoming[0] || null;
}

/** Minutes until a date. */
export function minutesUntil(date, now = new Date()) {
  return Math.max(0, Math.round((new Date(date) - now) / 60000));
}

export function humanCountdown(mins) {
  if (mins <= 0) return "now";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Taken vs expected over the last N days. */
export function adherence(reminders, days = 7, now = new Date()) {
  let taken = 0;
  let total = 0;
  const perDay = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = dayKey(d);
    let dayTaken = 0;
    let dayTotal = 0;
    (reminders || []).forEach((r) => {
      if (!isActive(r, key)) return;
      const slots = scheduleFor(r);
      dayTotal += slots.length;
      dayTaken += ((r.taken || {})[key] || []).filter((t) => slots.includes(t)).length;
    });
    taken += dayTaken;
    total += dayTotal;
    perDay.unshift({ key, taken: dayTaken, total: dayTotal });
  }
  return {
    taken,
    total,
    pct: total ? Math.round((taken / total) * 100) : 0,
    perDay,
  };
}

/** Which day of the course are we on? */
export function courseDay(reminder, now = new Date()) {
  if (!reminder?.start_date) return null;
  const start = new Date(`${reminder.start_date}T00:00:00`);
  const end = reminder.end_date ? new Date(`${reminder.end_date}T00:00:00`) : null;
  const day = Math.floor((new Date(dayKey(now)) - start) / DAY_MS) + 1;
  const total = end ? Math.floor((end - start) / DAY_MS) + 1 : null;
  return { day: Math.max(1, day), total };
}
