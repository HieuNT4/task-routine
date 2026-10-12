import {
  addDays,
  addMonths,
  dateRange,
  daysInMonth,
  parseISODate,
  timeToMinutes,
  WEEKDAY_SHORT,
} from "./date";
import type { CustomUnit, Occurrence, Task } from "./types";

/*
 * Two scheduling models:
 *
 * 1. Calendar tasks (daily / weekly / monthly / yearly) are bound to dates by a fixed rule.
 *    Postponing moves a single occurrence via `reschedules[originalDate] = newDate`;
 *    the rule itself never changes.
 *
 * 2. Custom tasks ("every N days/weeks/months") are driven by `nextDue`.
 *    Completing sets nextDue = doneDate + interval, postponing sets nextDue = newDate,
 *    so the whole series shifts with it. An unfinished custom task stays overdue
 *    until it is done.
 */

export const completionKey = (date: string, taskId: string): string => `${date}|${taskId}`;

export const isCalendarTask = (task: Task): boolean => task.frequency !== "custom";

const clampDay = (iso: string, day: number): number => {
  const d = parseISODate(iso);
  return Math.min(day, daysInMonth(d.getFullYear(), d.getMonth() + 1));
};

/** Whether the base rule (ignoring reschedules) hits the given date */
export const matchesRule = (task: Task, iso: string): boolean => {
  const d = parseISODate(iso);
  switch (task.frequency) {
    case "daily":
      return true;
    case "weekly":
      return (task.daysOfWeek ?? []).includes(d.getDay());
    case "monthly": {
      const months = task.monthsOfYear ?? [];
      if (months.length > 0 && !months.includes(d.getMonth() + 1)) return false;
      return d.getDate() === clampDay(iso, task.dayOfMonth ?? 1);
    }
    case "yearly":
      return (
        d.getMonth() + 1 === (task.monthOfYear ?? 1) &&
        d.getDate() === clampDay(iso, task.dayOfMonth ?? 1)
      );
    default:
      return false;
  }
};

/** Returns the original date when the occurrence on `iso` was moved here, else undefined */
const movedInFrom = (task: Task, iso: string): string | undefined => {
  const entries = Object.entries(task.reschedules ?? {});
  const hit = entries.find(([from, to]) => to === iso && from !== iso);
  return hit?.[0];
};

const isMovedAway = (task: Task, iso: string): boolean => {
  const target = task.reschedules?.[iso];
  return target !== undefined && target !== iso;
};

export const addInterval = (iso: string, amount: number, unit: CustomUnit): string => {
  const n = Math.max(1, Math.floor(amount));
  if (unit === "month") return addMonths(iso, n);
  if (unit === "week") return addDays(iso, n * 7);
  return addDays(iso, n);
};

/** Occurrence of a single task on a date, or null */
export const occurrenceOn = (task: Task, iso: string, today: string): Occurrence | null => {
  if (!task.isActive) return null;

  if (task.frequency === "custom") {
    if (task.lastDone === iso) return { task, date: iso, overdue: false };
    if (!task.nextDue) return null;
    if (task.nextDue === iso) return { task, date: iso, overdue: false };
    if (iso === today && task.nextDue < today) return { task, date: iso, overdue: true };
    return null;
  }

  const movedFrom = movedInFrom(task, iso);
  if (movedFrom) return { task, date: iso, overdue: false, movedFrom };
  if (isMovedAway(task, iso)) return null;
  return matchesRule(task, iso) ? { task, date: iso, overdue: false } : null;
};

export const sortByTime = (a: Occurrence, b: Occurrence): number =>
  timeToMinutes(a.task.time) - timeToMinutes(b.task.time) || a.task.name.localeCompare(b.task.name);

export const occurrencesOn = (tasks: Task[], iso: string, today: string): Occurrence[] =>
  tasks
    .map((t) => occurrenceOn(t, iso, today))
    .filter((o): o is Occurrence => o !== null)
    .sort(sortByTime);

/** Projected dates of a custom task in [from, from + days) without mutating it */
const projectCustom = (task: Task, from: string, days: number, today: string): string[] => {
  if (!task.nextDue) return [];
  const end = addDays(from, days);
  const result: string[] = [];
  let cursor = task.nextDue < today ? today : task.nextDue;
  let guard = 0;
  while (cursor < end && guard < 500) {
    if (cursor >= from) result.push(cursor);
    cursor = addInterval(cursor, task.customInterval ?? 1, task.customUnit ?? "day");
    guard += 1;
  }
  return result;
};

/** Upcoming occurrences grouped by day, including projections for custom tasks */
export const upcomingByDay = (
  tasks: Task[],
  from: string,
  days: number,
  today: string,
): { date: string; items: Occurrence[] }[] =>
  dateRange(from, days).map((iso) => {
    const items = tasks
      .map((task): Occurrence | null => {
        if (!task.isActive) return null;
        if (task.frequency !== "custom") return occurrenceOn(task, iso, today);
        if (iso === today) return occurrenceOn(task, iso, today);
        return projectCustom(task, iso, 1, today).length > 0
          ? { task, date: iso, overdue: false }
          : null;
      })
      .filter((o): o is Occurrence => o !== null)
      .sort(sortByTime);
    return { date: iso, items };
  });

/** Next date (>= from) the task is scheduled, searching up to ~13 months ahead */
export const nextOccurrence = (task: Task, from: string, today: string): string | undefined => {
  if (!task.isActive) return undefined;
  if (task.frequency === "custom") {
    if (!task.nextDue) return undefined;
    return task.nextDue < from ? from : task.nextDue;
  }
  for (let i = 0; i < 400; i += 1) {
    const iso = addDays(from, i);
    if (occurrenceOn(task, iso, today)) return iso;
  }
  return undefined;
};

/** Returns the updated task after marking the occurrence on `date` as done */
export const applyCompletion = (task: Task, date: string, today: string): Task => {
  const lastDone = !task.lastDone || date > task.lastDone ? date : task.lastDone;
  if (task.frequency === "custom") {
    const nextDue = addInterval(date, task.customInterval ?? 1, task.customUnit ?? "day");
    return { ...task, lastDone, nextDue };
  }
  const next = nextOccurrence(task, addDays(date, 1), today);
  return { ...task, lastDone, nextDue: next };
};

/** Returns the updated task after un-ticking; `previousDone` is the latest remaining completion */
export const revertCompletion = (
  task: Task,
  date: string,
  previousDone: string | undefined,
  today: string,
): Task => {
  if (task.frequency === "custom") {
    return { ...task, lastDone: previousDone, nextDue: date };
  }
  return { ...task, lastDone: previousDone, nextDue: nextOccurrence(task, today, today) };
};

/** Moves the occurrence on `fromDate` to `toDate` */
export const applyPostpone = (
  task: Task,
  fromDate: string,
  toDate: string,
  today: string,
): Task => {
  if (task.frequency === "custom") {
    return { ...task, nextDue: toDate };
  }

  const reschedules = { ...(task.reschedules ?? {}) };
  // If this occurrence was already moved here, re-target the original entry instead of chaining
  const original = movedInFrom(task, fromDate) ?? fromDate;
  if (original === toDate) {
    delete reschedules[original];
  } else {
    reschedules[original] = toDate;
  }

  // Drop entries that are fully in the past to keep storage small
  const cutoff = addDays(today, -60);
  Object.keys(reschedules).forEach((from) => {
    if (from < cutoff && reschedules[from] < cutoff) delete reschedules[from];
  });

  const updated = { ...task, reschedules };
  return { ...updated, nextDue: nextOccurrence(updated, today, today) };
};

const UNIT_LABEL: Record<CustomUnit, string> = { day: "ngày", week: "tuần", month: "tháng" };

export const frequencyLabel = (task: Task): string => {
  switch (task.frequency) {
    case "daily":
      return "Hàng ngày";
    case "weekly": {
      const days = [...(task.daysOfWeek ?? [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      if (days.length === 7) return "Hàng ngày";
      return days.map((d) => WEEKDAY_SHORT[d]).join(", ") || "Chưa chọn thứ";
    }
    case "monthly": {
      const months = task.monthsOfYear ?? [];
      const base = `Ngày ${task.dayOfMonth ?? 1}`;
      return months.length > 0
        ? `${base}, tháng ${months.join(", ")}`
        : `${base} hàng tháng`;
    }
    case "yearly":
      return `${task.dayOfMonth ?? 1}/${task.monthOfYear ?? 1} hàng năm`;
    case "custom":
      return `${task.customInterval ?? 1} ${UNIT_LABEL[task.customUnit ?? "day"]}/lần`;
    default:
      return "";
  }
};