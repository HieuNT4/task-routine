import { minutesToTime, timeToMinutes } from "./date";
import { completionKey, occurrencesOn } from "./schedule";
import type { Settings, Task } from "./types";

export type PlanKind = "task" | "repeat" | "water" | "endOfDay";

export interface PlannedNotification {
  id: string;
  /** Minutes since midnight */
  minutes: number;
  kind: PlanKind;
  taskIds: string[];
}

export interface NotificationPayload {
  title: string;
  body: string;
  tag: string;
}

export interface NotificationContext {
  date: string;
  tasks: Task[];
  doneKeys: Set<string>;
  waterMl: number;
  settings: Settings;
}

const groupByMinute = (
  entries: { minutes: number; taskId: string }[],
): Map<number, string[]> => {
  const map = new Map<number, string[]>();
  entries.forEach(({ minutes, taskId }) => {
    map.set(minutes, [...(map.get(minutes) ?? []), taskId]);
  });
  return map;
};

/** Everything that may be shown today; conditions are evaluated later at fire time */
export const buildPlan = (date: string, tasks: Task[], settings: Settings): PlannedNotification[] => {
  const occurrences = occurrencesOn(tasks, date, date);
  const plan: PlannedNotification[] = [];

  const onTime = groupByMinute(
    occurrences.map((o) => ({ minutes: timeToMinutes(o.task.time), taskId: o.task.id })),
  );
  onTime.forEach((taskIds, minutes) => {
    plan.push({ id: `task@${minutesToTime(minutes)}`, minutes, kind: "task", taskIds });
  });

  const repeats = groupByMinute(
    occurrences
      .filter((o) => (o.task.remindAgainMin ?? 0) > 0)
      .map((o) => ({
        minutes: timeToMinutes(o.task.time) + (o.task.remindAgainMin ?? 0),
        taskId: o.task.id,
      }))
      .filter((e) => e.minutes < 24 * 60),
  );
  repeats.forEach((taskIds, minutes) => {
    plan.push({ id: `repeat@${minutesToTime(minutes)}`, minutes, kind: "repeat", taskIds });
  });

  plan.push({
    id: "water",
    minutes: timeToMinutes(settings.waterCheckTime),
    kind: "water",
    taskIds: [],
  });
  plan.push({
    id: "endOfDay",
    minutes: timeToMinutes(settings.endOfDayTime),
    kind: "endOfDay",
    taskIds: occurrences.map((o) => o.task.id),
  });

  return plan.sort((a, b) => a.minutes - b.minutes);
};

const formatLiters = (ml: number): string => String(Number((ml / 1000).toFixed(2)));

/** Returns what to show, or null when the condition no longer holds (e.g. task already done) */
export const resolveNotification = (
  item: PlannedNotification,
  ctx: NotificationContext,
): NotificationPayload | null => {
  const byId = new Map(ctx.tasks.map((t) => [t.id, t]));
  const pending = item.taskIds
    .map((id) => byId.get(id))
    .filter((t): t is Task => !!t && !ctx.doneKeys.has(completionKey(ctx.date, t.id)));

  switch (item.kind) {
    case "task": {
      if (pending.length === 0) return null;
      const notes = pending.map((t) => t.note).filter(Boolean);
      return {
        title: `${minutesToTime(item.minutes)} · ${pending.map((t) => t.name).join(", ")}`,
        body: notes[0] ?? "Chạm để mở app và đánh dấu hoàn thành.",
        tag: item.id,
      };
    }
    case "repeat":
      if (pending.length === 0) return null;
      return {
        title: `Nhắc lại: ${pending.map((t) => t.name).join(", ")}`,
        body: "Bạn chưa đánh dấu hoàn thành việc này.",
        tag: item.id,
      };
    case "water": {
      const target = ctx.settings.waterTargetMl;
      if (ctx.waterMl >= target) return null;
      return {
        title: `Mới uống ${formatLiters(ctx.waterMl)}/${formatLiters(target)}L nước`,
        body: `Còn thiếu ${target - ctx.waterMl}ml. Uống thêm trước khi đi ngủ nhé.`,
        tag: item.id,
      };
    }
    case "endOfDay": {
      if (pending.length === 0) return null;
      const names = pending.slice(0, 4).map((t) => t.name).join(", ");
      const more = pending.length > 4 ? ` và ${pending.length - 4} việc khác` : "";
      return {
        title: `Còn ${pending.length} việc chưa làm hôm nay`,
        body: `${names}${more}.`,
        tag: item.id,
      };
    }
    default:
      return null;
  }
};

export const notificationSupported = (): boolean =>
  typeof window !== "undefined" && "Notification" in window;

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!notificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
};

export const showNotification = async (payload: NotificationPayload): Promise<void> => {
  if (!notificationSupported() || Notification.permission !== "granted") return;
  const options: NotificationOptions = {
    body: payload.body,
    tag: payload.tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    data: { url: "/" },
  };
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.showNotification(payload.title, options);
      return;
    }
  }
  // Dev mode has no service worker
  new Notification(payload.title, options);
};
