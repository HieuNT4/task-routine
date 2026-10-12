import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { buildDefaultMenu, buildDefaultTasks, DEFAULT_SETTINGS, DEFAULT_SHOPPING } from "./defaults";
import { firestore } from "./firebase";
import { todayISO } from "./date";
import type { Completion, MenuPlan, Metrics, Settings, ShoppingItem, Task, WaterLog } from "./types";

export interface UserProfile {
  tasks: Task[];
  settings: Settings;
  menu: MenuPlan;
  shopping: ShoppingItem[];
}

const requireDb = () => {
  if (!firestore) throw new Error("Firebase chưa được cấu hình");
  return firestore;
};

const profileRef = (uid: string) => doc(requireDb(), "users", uid);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asProfile = (data: DocumentData): UserProfile | null => {
  if (!Array.isArray(data.tasks) || !isRecord(data.settings) || !isRecord(data.menu)) return null;
  const menu = data.menu as unknown as MenuPlan;
  if (!Array.isArray(menu.weeks)) return null;
  return {
    tasks: data.tasks as Task[],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings as Partial<Settings>) },
    menu,
    shopping: Array.isArray(data.shopping) ? (data.shopping as ShoppingItem[]) : DEFAULT_SHOPPING,
  };
};

export const emptyProfile = (today: string): UserProfile => ({
  tasks: buildDefaultTasks(today),
  settings: DEFAULT_SETTINGS,
  menu: buildDefaultMenu(today),
  shopping: DEFAULT_SHOPPING,
});

export const loadOrSeedProfile = async (uid: string): Promise<UserProfile> => {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const parsed = asProfile(snap.data());
    if (parsed) return parsed;
  }
  const seeded = emptyProfile(todayISO());
  await setDoc(ref, seeded);
  return seeded;
};

export const saveProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  await setDoc(profileRef(uid), profile, { merge: true });
};

export const watchProfile = (uid: string, onData: (profile: UserProfile) => void): Unsubscribe =>
  onSnapshot(profileRef(uid), (snap) => {
    if (!snap.exists()) return;
    const parsed = asProfile(snap.data());
    if (parsed) onData(parsed);
  });

const logCollection = (uid: string, name: "completions" | "water" | "metrics") =>
  collection(requireDb(), "users", uid, name);

export const watchCompletions = (uid: string, onData: (rows: Completion[]) => void): Unsubscribe =>
  onSnapshot(logCollection(uid, "completions"), (snap) => {
    onData(snap.docs.map((item) => item.data() as Completion));
  });

export const watchWater = (uid: string, onData: (rows: WaterLog[]) => void): Unsubscribe =>
  onSnapshot(logCollection(uid, "water"), (snap) => {
    onData(snap.docs.map((item) => item.data() as WaterLog));
  });

export const watchMetrics = (uid: string, onData: (rows: Metrics[]) => void): Unsubscribe =>
  onSnapshot(logCollection(uid, "metrics"), (snap) => {
    onData(snap.docs.map((item) => item.data() as Metrics));
  });

export const putCompletion = async (uid: string, row: Completion): Promise<void> => {
  await setDoc(doc(logCollection(uid, "completions"), row.key), row);
};

export const removeCompletion = async (uid: string, key: string): Promise<void> => {
  await deleteDoc(doc(logCollection(uid, "completions"), key));
};

export const putWater = async (uid: string, row: WaterLog): Promise<void> => {
  await setDoc(doc(logCollection(uid, "water"), row.date), row);
};

export const putMetrics = async (uid: string, row: Metrics): Promise<void> => {
  await setDoc(doc(logCollection(uid, "metrics"), row.date), row);
};

const replaceCollection = async (
  uid: string,
  name: "completions" | "water" | "metrics",
  rows: { id: string; data: DocumentData }[],
): Promise<void> => {
  const existing = await getDocs(logCollection(uid, name));
  const db = requireDb();
  const deletes = existing.docs.map((item) => item.ref);
  const writes = rows.map((row) => ({ ref: doc(logCollection(uid, name), row.id), data: row.data }));
  const chunk = 400;
  for (let i = 0; i < deletes.length; i += chunk) {
    const batch = writeBatch(db);
    deletes.slice(i, i + chunk).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  for (let i = 0; i < writes.length; i += chunk) {
    const batch = writeBatch(db);
    writes.slice(i, i + chunk).forEach((row) => batch.set(row.ref, row.data));
    await batch.commit();
  }
};

export const replaceLogs = async (
  uid: string,
  logs: { completions: Completion[]; water: WaterLog[]; metrics: Metrics[] },
): Promise<void> => {
  await Promise.all([
    replaceCollection(
      uid,
      "completions",
      logs.completions.map((row) => ({ id: row.key, data: { ...row } })),
    ),
    replaceCollection(
      uid,
      "water",
      logs.water.map((row) => ({ id: row.date, data: { ...row } })),
    ),
    replaceCollection(
      uid,
      "metrics",
      logs.metrics.map((row) => ({ id: row.date, data: { ...row } })),
    ),
  ]);
};
