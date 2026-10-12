"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/date";
import {
  buildDefaultTasks,
  buildDefaultMenu,
  DEFAULT_SETTINGS,
  DEFAULT_SHOPPING,
} from "@/lib/defaults";
import {
  applyCompletion,
  applyPostpone,
  completionKey,
  nextOccurrence,
  revertCompletion,
} from "@/lib/schedule";
import {
  clearAppStorage,
  loadMenu,
  loadSettings,
  loadShopping,
  loadTasks,
  saveMenu,
  saveSettings,
  saveShopping,
  saveTasks,
} from "@/lib/storage";
import type {
  BackupFile,
  Completion,
  Metrics,
  Settings,
  ShoppingItem,
  Task,
  MenuPlan,
} from "@/lib/types";

interface AppDataValue {
  ready: boolean;
  today: string;
  tasks: Task[];
  settings: Settings;
  menu: MenuPlan;
  shopping: ShoppingItem[];
  completions: Completion[];
  doneKeys: Set<string>;
  water: Record<string, number>;
  metrics: Metrics[];
  isDone: (taskId: string, date: string) => boolean;
  toggleTask: (task: Task, date: string) => Promise<void>;
  postponeTask: (task: Task, fromDate: string, toDate: string) => void;
  saveTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addWater: (deltaMl: number, date?: string) => Promise<void>;
  saveMetrics: (m: Metrics) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  updateMenu: (menu: MenuPlan) => void;
  updateShopping: (items: ShoppingItem[]) => void;
  exportBackup: () => BackupFile;
  importBackup: (backup: BackupFile) => Promise<void>;
  resetAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<string>(() => todayISO());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [menu, setMenu] = useState<MenuPlan>(() => buildDefaultMenu(todayISO()));
  const [shopping, setShopping] = useState<ShoppingItem[]>(DEFAULT_SHOPPING);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [water, setWater] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const waterRef = useRef<Record<string, number>>({});

  const commitWater = useCallback((next: Record<string, number>) => {
    waterRef.current = next;
    setWater(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const now = todayISO();
      const storedTasks = loadTasks();
      const initialTasks = storedTasks ?? buildDefaultTasks(now);
      if (!storedTasks) saveTasks(initialTasks);

      const [allCompletions, allWater, allMetrics] = await Promise.all([
        db.allCompletions(),
        db.allWater(),
        db.allMetrics(),
      ]);
      if (cancelled) return;

      setTasks(initialTasks);
      setSettings(loadSettings(DEFAULT_SETTINGS));
      setMenu(loadMenu(buildDefaultMenu(now)));
      setShopping(loadShopping(DEFAULT_SHOPPING));
      setCompletions(allCompletions);
      commitWater(Object.fromEntries(allWater.map((w) => [w.date, w.ml])));
      setMetrics(allMetrics.sort((a, b) => a.date.localeCompare(b.date)));
      setReady(true);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [commitWater]);

  // Roll over to a new day while the app stays open
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = todayISO();
      setToday((prev) => (prev === now ? prev : now));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (ready) saveTasks(tasks);
  }, [ready, tasks]);
  useEffect(() => {
    if (ready) saveSettings(settings);
  }, [ready, settings]);
  useEffect(() => {
    if (ready) saveMenu(menu);
  }, [ready, menu]);
  useEffect(() => {
    if (ready) saveShopping(shopping);
  }, [ready, shopping]);

  const doneKeys = useMemo(() => new Set(completions.map((c) => c.key)), [completions]);

  const isDone = useCallback(
    (taskId: string, date: string) => doneKeys.has(completionKey(date, taskId)),
    [doneKeys],
  );

  const replaceTask = useCallback((updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const toggleTask = useCallback(
    async (task: Task, date: string) => {
      const key = completionKey(date, task.id);
      if (doneKeys.has(key)) {
        await db.deleteCompletion(key);
        const remaining = completions.filter((c) => c.key !== key);
        const previousDone = remaining
          .filter((c) => c.taskId === task.id)
          .map((c) => c.date)
          .sort()
          .pop();
        setCompletions(remaining);
        replaceTask(revertCompletion(task, date, previousDone, today));
        return;
      }
      const completion: Completion = {
        key,
        date,
        taskId: task.id,
        doneAt: new Date().toISOString(),
      };
      await db.putCompletion(completion);
      setCompletions((prev) => [...prev, completion]);
      replaceTask(applyCompletion(task, date, today));
    },
    [completions, doneKeys, replaceTask, today],
  );

  const postponeTask = useCallback(
    (task: Task, fromDate: string, toDate: string) => {
      replaceTask(applyPostpone(task, fromDate, toDate, today));
    },
    [replaceTask, today],
  );

  const saveTask = useCallback(
    (task: Task) => {
      const withNext: Task =
        task.frequency === "custom"
          ? { ...task, nextDue: task.nextDue ?? today }
          : { ...task, nextDue: nextOccurrence(task, today, today) };
      setTasks((prev) =>
        prev.some((t) => t.id === task.id)
          ? prev.map((t) => (t.id === task.id ? withNext : t))
          : [...prev, withNext],
      );
    },
    [today],
  );

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const addWater = useCallback(
    async (deltaMl: number, date?: string) => {
      const day = date ?? today;
      // Read from the ref so rapid taps accumulate before React re-renders
      const ml = Math.max(0, (waterRef.current[day] ?? 0) + deltaMl);
      commitWater({ ...waterRef.current, [day]: ml });
      await db.putWater({ date: day, ml });
    },
    [commitWater, today],
  );

  const saveMetrics = useCallback(async (m: Metrics) => {
    await db.putMetrics(m);
    setMetrics((prev) =>
      [...prev.filter((x) => x.date !== m.date), m].sort((a, b) => a.date.localeCompare(b.date)),
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const exportBackup = useCallback(
    (): BackupFile => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      settings,
      menu,
      shopping,
      completions,
      water: Object.entries(water).map(([date, ml]) => ({ date, ml })),
      metrics,
    }),
    [completions, menu, metrics, settings, shopping, tasks, water],
  );

  const importBackup = useCallback(async (backup: BackupFile) => {
    if (backup.version !== 1 || !Array.isArray(backup.tasks)) {
      throw new Error("File sao lưu không hợp lệ");
    }
    await db.replaceAll({
      completions: backup.completions ?? [],
      water: backup.water ?? [],
      metrics: backup.metrics ?? [],
    });
    setTasks(backup.tasks);
    setSettings({ ...DEFAULT_SETTINGS, ...backup.settings });
    setMenu(backup.menu?.weeks ? backup.menu : buildDefaultMenu(todayISO()));
    setShopping(backup.shopping ?? DEFAULT_SHOPPING);
    setCompletions(backup.completions ?? []);
    commitWater(Object.fromEntries((backup.water ?? []).map((w) => [w.date, w.ml])));
    setMetrics([...(backup.metrics ?? [])].sort((a, b) => a.date.localeCompare(b.date)));
  }, [commitWater]);

  const resetAll = useCallback(async () => {
    await db.replaceAll({ completions: [], water: [], metrics: [] });
    clearAppStorage();
    const now = todayISO();
    setTasks(buildDefaultTasks(now));
    setSettings(DEFAULT_SETTINGS);
    setMenu(buildDefaultMenu(todayISO()));
    setShopping(DEFAULT_SHOPPING);
    setCompletions([]);
    commitWater({});
    setMetrics([]);
  }, [commitWater]);

  const value = useMemo<AppDataValue>(
    () => ({
      ready,
      today,
      tasks,
      settings,
      menu,
      shopping,
      completions,
      doneKeys,
      water,
      metrics,
      isDone,
      toggleTask,
      postponeTask,
      saveTask,
      deleteTask,
      addWater,
      saveMetrics,
      updateSettings,
      updateMenu: setMenu,
      updateShopping: setShopping,
      exportBackup,
      importBackup,
      resetAll,
    }),
    [
      ready,
      today,
      tasks,
      settings,
      menu,
      shopping,
      completions,
      doneKeys,
      water,
      metrics,
      isDone,
      toggleTask,
      postponeTask,
      saveTask,
      deleteTask,
      addWater,
      saveMetrics,
      updateSettings,
      exportBackup,
      importBackup,
      resetAll,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = (): AppDataValue => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
};
