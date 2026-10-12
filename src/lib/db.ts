import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Completion, Metrics, WaterLog } from "./types";

interface DoctorMenDB extends DBSchema {
  completions: {
    key: string;
    value: Completion;
    indexes: { byDate: string; byTask: string };
  };
  water: {
    key: string;
    value: WaterLog;
  };
  metrics: {
    key: string;
    value: Metrics;
  };
}

const DB_NAME = "doctor-men";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DoctorMenDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<DoctorMenDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<DoctorMenDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const completions = db.createObjectStore("completions", { keyPath: "key" });
        completions.createIndex("byDate", "date");
        completions.createIndex("byTask", "taskId");
        db.createObjectStore("water", { keyPath: "date" });
        db.createObjectStore("metrics", { keyPath: "date" });
      },
    });
  }
  return dbPromise;
};

export const db = {
  async allCompletions(): Promise<Completion[]> {
    return (await getDB()).getAll("completions");
  },
  async putCompletion(c: Completion): Promise<void> {
    await (await getDB()).put("completions", c);
  },
  async deleteCompletion(key: string): Promise<void> {
    await (await getDB()).delete("completions", key);
  },
  async completionsByTask(taskId: string): Promise<Completion[]> {
    return (await getDB()).getAllFromIndex("completions", "byTask", taskId);
  },

  async allWater(): Promise<WaterLog[]> {
    return (await getDB()).getAll("water");
  },
  async putWater(w: WaterLog): Promise<void> {
    await (await getDB()).put("water", w);
  },

  async allMetrics(): Promise<Metrics[]> {
    return (await getDB()).getAll("metrics");
  },
  async putMetrics(m: Metrics): Promise<void> {
    await (await getDB()).put("metrics", m);
  },

  async replaceAll(data: {
    completions: Completion[];
    water: WaterLog[];
    metrics: Metrics[];
  }): Promise<void> {
    const conn = await getDB();
    const tx = conn.transaction(["completions", "water", "metrics"], "readwrite");
    await Promise.all([
      tx.objectStore("completions").clear(),
      tx.objectStore("water").clear(),
      tx.objectStore("metrics").clear(),
    ]);
    await Promise.all([
      ...data.completions.map((c) => tx.objectStore("completions").put(c)),
      ...data.water.map((w) => tx.objectStore("water").put(w)),
      ...data.metrics.map((m) => tx.objectStore("metrics").put(m)),
    ]);
    await tx.done;
  },
};
