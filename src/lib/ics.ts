import { addDays, timeToMinutes } from "./date";
import { nextOccurrence } from "./schedule";
import type { Task } from "./types";

// Exports tasks as an iCalendar file so the phone's native Calendar can fire
// reminders even when the PWA is fully closed (works without any server).

const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const escapeText = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const toICSDateTime = (iso: string, hhmm: string): string => {
  const mins = timeToMinutes(hhmm);
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${iso.replace(/-/g, "")}T${h}${m}00`;
};

const stamp = (): string => new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const rruleFor = (task: Task): string => {
  switch (task.frequency) {
    case "daily":
      return "FREQ=DAILY";
    case "weekly":
      return `FREQ=WEEKLY;BYDAY=${(task.daysOfWeek ?? []).map((d) => BYDAY[d]).join(",")}`;
    case "monthly": {
      const months = task.monthsOfYear ?? [];
      const byMonth = months.length > 0 ? `;BYMONTH=${months.join(",")}` : "";
      return `FREQ=MONTHLY;BYMONTHDAY=${task.dayOfMonth ?? 1}${byMonth}`;
    }
    case "yearly":
      return `FREQ=YEARLY;BYMONTH=${task.monthOfYear ?? 1};BYMONTHDAY=${task.dayOfMonth ?? 1}`;
    case "custom": {
      const freq = { day: "DAILY", week: "WEEKLY", month: "MONTHLY" }[task.customUnit ?? "day"];
      return `FREQ=${freq};INTERVAL=${task.customInterval ?? 1}`;
    }
    default:
      return "FREQ=DAILY";
  }
};

export const buildICS = (tasks: Task[], today: string): string => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Doctor Men//Daily Routine//VI",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Lịch sinh hoạt",
  ];

  tasks
    .filter((t) => t.isActive)
    .filter((t) => t.frequency !== "weekly" || (t.daysOfWeek ?? []).length > 0)
    .forEach((task) => {
      const start = nextOccurrence(task, today, today) ?? addDays(today, 1);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${task.id}@doctor-men`,
        `DTSTAMP:${stamp()}`,
        `DTSTART:${toICSDateTime(start, task.time)}`,
        "DURATION:PT15M",
        `RRULE:${rruleFor(task)}`,
        `SUMMARY:${escapeText(task.name)}`,
        ...(task.note ? [`DESCRIPTION:${escapeText(task.note)}`] : []),
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(task.name)}`,
        "TRIGGER:PT0M",
        "END:VALARM",
        "END:VEVENT",
      );
    });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

export const downloadFile = (filename: string, content: string, mime: string): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
