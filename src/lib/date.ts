// All dates are local calendar dates in "YYYY-MM-DD" form to avoid timezone drift.

const pad = (n: number): string => String(n).padStart(2, "0");

export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = (): string => toISODate(new Date());

export const addDays = (iso: string, days: number): string => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const daysInMonth = (year: number, month1: number): number =>
  new Date(year, month1, 0).getDate();

/** Adds months while clamping the day (Jan 31 + 1 month = Feb 28/29) */
export const addMonths = (iso: string, months: number): string => {
  const d = parseISODate(iso);
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const maxDay = daysInMonth(target.getFullYear(), target.getMonth() + 1);
  target.setDate(Math.min(day, maxDay));
  return toISODate(target);
};

export const diffDays = (fromISO: string, toISO: string): number => {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISO).getTime();
  return Math.round((b - a) / 86_400_000);
};

export const dayOfWeek = (iso: string): number => parseISODate(iso).getDay();

/** Monday-based start of week */
export const startOfWeek = (iso: string): string => {
  const dow = dayOfWeek(iso);
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(iso, offset);
};

export const dateRange = (fromISO: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => addDays(fromISO, i));

export const timeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (mins: number): string => {
  const normalized = ((mins % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

export const nowMinutes = (): number => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const atTime = (iso: string, hhmm: string): Date => {
  const d = parseISODate(iso);
  const mins = timeToMinutes(hhmm);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
};

export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const WEEKDAY_LONG = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

export const formatLongDate = (iso: string): string => {
  const d = parseISODate(iso);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
};

export const formatShortDate = (iso: string): string => {
  const d = parseISODate(iso);
  return `${WEEKDAY_SHORT[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

export const formatMinutesAsDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
};
