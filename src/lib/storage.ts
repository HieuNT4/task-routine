import type { MenuPlan, Settings, ShoppingItem, Task } from "./types";

const PREFIX = "dm:v2:";

export const STORAGE_KEYS = {
  tasks: `${PREFIX}tasks`,
  settings: `${PREFIX}settings`,
  menu: `${PREFIX}menu`,
  shopping: `${PREFIX}shopping`,
  firedPrefix: `${PREFIX}fired:`,
} as const;

const isBrowser = (): boolean => typeof window !== "undefined" && "localStorage" in window;

export const readJSON = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = <T>(key: string, value: T): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const hasKey = (key: string): boolean =>
  isBrowser() && window.localStorage.getItem(key) !== null;

export const loadTasks = (): Task[] | null =>
  hasKey(STORAGE_KEYS.tasks) ? readJSON<Task[]>(STORAGE_KEYS.tasks, []) : null;
export const saveTasks = (tasks: Task[]): void => writeJSON(STORAGE_KEYS.tasks, tasks);

export const loadSettings = (fallback: Settings): Settings => ({
  ...fallback,
  ...readJSON<Partial<Settings>>(STORAGE_KEYS.settings, {}),
});
export const saveSettings = (s: Settings): void => writeJSON(STORAGE_KEYS.settings, s);

const isMenuPlan = (value: unknown): value is MenuPlan => {
  if (!value || typeof value !== "object") return false;
  const plan = value as MenuPlan;
  return Array.isArray(plan.weeks) && plan.weeks.length === 2 && typeof plan.anchorMonday === "string";
};

export const loadMenu = (fallback: MenuPlan): MenuPlan => {
  const stored = readJSON<unknown>(STORAGE_KEYS.menu, null);
  return isMenuPlan(stored) ? stored : fallback;
};
export const saveMenu = (m: MenuPlan): void => writeJSON(STORAGE_KEYS.menu, m);

export const loadShopping = (fallback: ShoppingItem[]): ShoppingItem[] =>
  readJSON<ShoppingItem[]>(STORAGE_KEYS.shopping, fallback);
export const saveShopping = (items: ShoppingItem[]): void =>
  writeJSON(STORAGE_KEYS.shopping, items);

/** IDs of notifications already shown on a given date */
export const loadFired = (date: string): string[] =>
  readJSON<string[]>(`${STORAGE_KEYS.firedPrefix}${date}`, []);

export const saveFired = (date: string, ids: string[]): void => {
  writeJSON(`${STORAGE_KEYS.firedPrefix}${date}`, ids);
  if (!isBrowser()) return;
  // Keep only today's log
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(STORAGE_KEYS.firedPrefix) && !k.endsWith(date))
    .forEach((k) => window.localStorage.removeItem(k));
};

export const clearAppStorage = (): void => {
  if (!isBrowser()) return;
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => window.localStorage.removeItem(k));
};

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
