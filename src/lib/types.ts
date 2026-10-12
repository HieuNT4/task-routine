export type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type CustomUnit = "day" | "week" | "month";

export type TaskCategory =
  | "routine"
  | "meal"
  | "exercise"
  | "chore"
  | "medicine"
  | "supplement"
  | "checkup";

export interface Task {
  id: string;
  name: string;
  /** HH:mm */
  time: string;
  frequency: Frequency;
  /** 0 = Sunday ... 6 = Saturday (weekly) */
  daysOfWeek?: number[];
  /** 1-31, clamped to the last day of short months (monthly, yearly) */
  dayOfMonth?: number;
  /** 1-12 (yearly) */
  monthOfYear?: number;
  /** Optional month filter for monthly tasks, e.g. [1, 7] = January and July only */
  monthsOfYear?: number[];
  /** Interval amount for custom frequency */
  customInterval?: number;
  customUnit?: CustomUnit;
  /** YYYY-MM-DD of the last completion */
  lastDone?: string;
  /** YYYY-MM-DD; drives custom tasks, also mirrors the next occurrence for the others */
  nextDue?: string;
  isActive: boolean;
  category: TaskCategory;
  note?: string;
  /** Re-notify after N minutes if still not done (0 = off) */
  remindAgainMin?: number;
  /**
   * One-off moves for calendar-based tasks (daily/weekly/monthly/yearly):
   * key = original date, value = new date. The base frequency stays unchanged.
   */
  reschedules?: Record<string, string>;
  /** Links a meal task to the meal screen ("Đã ăn" ticks this task) */
  mealSlot?: MealSlot;
  createdAt: string;
}

export interface Settings {
  waterTargetMl: number;
  waterStepMl: number;
  /** HH:mm — check water progress */
  waterCheckTime: string;
  /** HH:mm — "before the day ends" reminder for unfinished tasks */
  endOfDayTime: string;
  notificationsEnabled: boolean;
  /** Fire reminders that were missed by up to N minutes when the app reopens */
  catchUpMinutes: number;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** One day's meals. Key = day of week (0 = Sunday ... 6 = Saturday) */
export type WeekMenu = Record<number, Record<MealSlot, string>>;

/** Two alternating weeks. Week 0 starts on anchorMonday. */
export interface MenuPlan {
  weeks: [WeekMenu, WeekMenu];
  anchorMonday: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
}

export interface Completion {
  /** `${date}|${taskId}` */
  key: string;
  date: string;
  taskId: string;
  doneAt: string;
}

export interface WaterLog {
  date: string;
  ml: number;
}

export interface Metrics {
  date: string;
  weightKg?: number;
  waistCm?: number;
  sleepMinutes?: number;
  /** 1-10 */
  freshness?: number;
}

/** A task instance placed on a concrete date */
export interface Occurrence {
  task: Task;
  date: string;
  /** The task was due earlier and is still not done (custom frequency only) */
  overdue: boolean;
  /** This occurrence was moved here from another date */
  movedFrom?: string;
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  tasks: Task[];
  settings: Settings;
  menu: MenuPlan;
  shopping: ShoppingItem[];
  completions: Completion[];
  water: WaterLog[];
  metrics: Metrics[];
}
