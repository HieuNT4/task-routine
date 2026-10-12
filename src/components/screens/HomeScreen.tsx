"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/PageHeader";
import PostponeDialog from "@/components/PostponeDialog";
import SectionTitle from "@/components/SectionTitle";
import TaskItem from "@/components/TaskItem";
import WaterCard from "@/components/WaterCard";
import { useAppData } from "@/context/AppDataContext";
import { useNowMinutes } from "@/hooks/useNowMinutes";
import { formatLongDate, timeToMinutes } from "@/lib/date";
import { occurrencesOn } from "@/lib/schedule";
import type { Occurrence } from "@/lib/types";
import { colors } from "@/theme/tokens";

/** A task turns red this many minutes after its time if still unticked */
const LATE_AFTER_MIN = 30;

export default function HomeScreen() {
  const { today, tasks, isDone, toggleTask, settings } = useAppData();
  const now = useNowMinutes();
  const [postponing, setPostponing] = useState<Occurrence | null>(null);

  const items = useMemo(() => occurrencesOn(tasks, today, today), [tasks, today]);
  const doneCount = items.filter((o) => isDone(o.task.id, today)).length;
  const pending = items.length - doneCount;
  const endOfDay = now >= timeToMinutes(settings.endOfDayTime);
  const notificationsOff =
    !settings.notificationsEnabled ||
    (typeof Notification !== "undefined" && Notification.permission !== "granted");

  const isLate = (o: Occurrence): boolean =>
    !isDone(o.task.id, today) &&
    (o.overdue || endOfDay || now > timeToMinutes(o.task.time) + LATE_AFTER_MIN);

  return (
    <Box className="HomeScreen">
      <PageHeader title="Hôm nay" subtitle={formatLongDate(today)} />

      <Box className="flex flex-col gap-3 px-5">
        {notificationsOff && (
          <Alert
            severity="info"
            action={
              <Button component={Link} href="/settings" size="small">
                Bật
              </Button>
            }
          >
            Thông báo đang tắt
          </Alert>
        )}

        <Box>
          <Box className="mb-2 flex items-baseline justify-between">
            <Typography variant="subtitle1">
              {doneCount}/{items.length} việc đã xong
            </Typography>
            <Typography variant="body2" sx={{ color: colors.muted }}>
              {items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={items.length > 0 ? (doneCount / items.length) * 100 : 0}
            sx={{ height: 6, borderRadius: 3, bgcolor: colors.line }}
          />
        </Box>

        <WaterCard />

        {endOfDay && pending > 0 && (
          <Alert severity="error">Còn {pending} việc chưa làm hôm nay</Alert>
        )}
      </Box>

      <Box className="px-3">
        <Box className="px-2">
          <SectionTitle>Lịch hôm nay</SectionTitle>
        </Box>
        {items.length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.muted, px: 2, py: 4 }}>
            Hôm nay không có task nào.
          </Typography>
        ) : (
          <Box className="flex flex-col gap-0.5">
            {items.map((o) => (
              <TaskItem
                key={o.task.id}
                occurrence={o}
                done={isDone(o.task.id, today)}
                late={isLate(o)}
                onToggle={() => toggleTask(o.task, today)}
                onPostpone={() => setPostponing(o)}
              />
            ))}
          </Box>
        )}
      </Box>

      <PostponeDialog occurrence={postponing} onClose={() => setPostponing(null)} />
    </Box>
  );
}
