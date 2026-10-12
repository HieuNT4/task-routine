"use client";

import { useEffect, useRef } from "react";
import { useAppData } from "@/context/AppDataContext";
import { nowMinutes, todayISO } from "@/lib/date";
import {
  buildPlan,
  notificationSupported,
  resolveNotification,
  showNotification,
} from "@/lib/notifications";
import { loadFired, saveFired } from "@/lib/storage";

const TICK_MS = 20_000;

/**
 * Local scheduler: while the app is open (or alive in the background), checks every
 * 20s which reminders are due and shows them via the service worker. Each reminder
 * fires once per day; conditions (task done? enough water?) are checked at fire time.
 */
export default function NotificationScheduler() {
  const data = useAppData();
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    const tick = () => {
      const { ready, tasks, settings, doneKeys, water } = latest.current;
      if (!ready || !settings.notificationsEnabled) return;
      if (!notificationSupported() || Notification.permission !== "granted") return;

      const date = todayISO();
      const now = nowMinutes();
      const fired = new Set(loadFired(date));
      let changed = false;

      buildPlan(date, tasks, settings).forEach((item) => {
        if (fired.has(item.id) || item.minutes > now) return;
        fired.add(item.id);
        changed = true;
        if (now - item.minutes > settings.catchUpMinutes) return;
        const payload = resolveNotification(item, {
          date,
          tasks,
          doneKeys,
          waterMl: water[date] ?? 0,
          settings,
        });
        if (payload) void showNotification(payload);
      });

      if (changed) saveFired(date, Array.from(fired));
    };

    tick();
    const id = window.setInterval(tick, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
