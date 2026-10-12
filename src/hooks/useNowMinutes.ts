"use client";

import { useEffect, useState } from "react";
import { nowMinutes } from "@/lib/date";

/** Minutes since midnight, refreshed every 30 seconds */
export const useNowMinutes = (): number => {
  const [now, setNow] = useState<number>(() => nowMinutes());
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};
