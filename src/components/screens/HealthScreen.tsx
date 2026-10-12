"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import HealthTaskRow from "@/components/HealthTaskRow";
import PageHeader from "@/components/PageHeader";
import PostponeDialog from "@/components/PostponeDialog";
import SectionTitle from "@/components/SectionTitle";
import TaskFormDialog from "@/components/TaskFormDialog";
import { useAppData } from "@/context/AppDataContext";
import { diffDays, formatShortDate } from "@/lib/date";
import { frequencyLabel, nextOccurrence, occurrenceOn } from "@/lib/schedule";
import type { Occurrence, Task, TaskCategory } from "@/lib/types";
import { colors } from "@/theme/tokens";

const dueText = (days: number): string => {
  if (days < 0) return `quá hạn ${-days} ngày`;
  if (days === 0) return "hôm nay";
  if (days === 1) return "ngày mai";
  return `còn ${days} ngày`;
};

export default function HealthScreen() {
  const { today, tasks, isDone, toggleTask, saveTask } = useAppData();
  const [postponing, setPostponing] = useState<Occurrence | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [preset, setPreset] = useState<Partial<Task> | null>(null);

  const byCategory = (c: TaskCategory) =>
    tasks.filter((t) => t.category === c).sort((a, b) => a.time.localeCompare(b.time));

  const medicines = byCategory("medicine");
  const supplements = byCategory("supplement");

  const checkups = useMemo(
    () =>
      tasks
        .filter((t) => t.category === "checkup")
        .map((t) => {
          const next =
            t.frequency === "custom" ? t.nextDue : nextOccurrence(t, today, today);
          return { task: t, next };
        })
        .sort((a, b) => (a.next ?? "9999").localeCompare(b.next ?? "9999")),
    [tasks, today],
  );
  const appointments = checkups.filter((c) => c.task.frequency === "custom");
  const periodic = checkups.filter((c) => c.task.frequency !== "custom");

  const renderIntake = (t: Task) => {
    const occ = occurrenceOn(t, today, today);
    const done = isDone(t.id, today);
    return (
      <HealthTaskRow
        key={t.id}
        task={t}
        dimmed={!t.isActive}
        detail={`${t.time} · ${frequencyLabel(t)}${t.note ? ` · ${t.note}` : ""}`}
        onClick={() => setEditing(t)}
        actions={
          <>
            {t.isActive && occ && (
              <Checkbox
                checked={done}
                onChange={() => toggleTask(t, today)}
                inputProps={{ "aria-label": `Đã uống ${t.name}` }}
              />
            )}
            <Switch
              checked={t.isActive}
              onChange={(e) => saveTask({ ...t, isActive: e.target.checked })}
              inputProps={{ "aria-label": `Đang dùng ${t.name}` }}
            />
          </>
        }
      />
    );
  };

  const renderCheckup = ({ task, next }: { task: Task; next?: string }, allowDone: boolean) => {
    const days = next ? diffDays(today, next) : null;
    const due = next ? Math.max(0, days ?? 0) : 0;
    const occurrenceDate = next && next < today ? today : (next ?? today);
    return (
      <HealthTaskRow
        key={task.id}
        task={task}
        dimmed={!task.isActive}
        detail={
          next
            ? `${formatShortDate(next)} · ${dueText(days ?? 0)} · ${frequencyLabel(task)}`
            : frequencyLabel(task)
        }
        detailDanger={days !== null && days < 0}
        onClick={() => setEditing(task)}
        actions={
          task.isActive && (
            <>
              <IconButton
                size="small"
                aria-label={`Dời ngày ${task.name}`}
                onClick={() =>
                  setPostponing({ task, date: occurrenceDate, overdue: (days ?? 0) < 0 })
                }
              >
                <EventRepeatRoundedIcon fontSize="small" sx={{ color: colors.muted }} />
              </IconButton>
              {allowDone && (
                <Button
                  size="small"
                  variant={due <= 7 ? "contained" : "outlined"}
                  onClick={() => toggleTask(task, today)}
                  disabled={isDone(task.id, today)}
                >
                  {isDone(task.id, today) ? "Xong" : "Đã khám"}
                </Button>
              )}
            </>
          )
        }
      />
    );
  };

  const addButton = (p: Partial<Task>) => (
    <IconButton size="small" onClick={() => setPreset(p)} aria-label="Thêm">
      <AddRoundedIcon fontSize="small" sx={{ color: colors.primary }} />
    </IconButton>
  );

  return (
    <Box className="HealthScreen">
      <PageHeader title="Thuốc & khám" subtitle="Sức khỏe" />

      <Box className="px-5">
        <SectionTitle action={addButton({ category: "medicine", time: "08:00" })}>
          Đang uống
        </SectionTitle>
        <Card className="px-4">{medicines.map(renderIntake)}</Card>

        <SectionTitle action={addButton({ category: "supplement", time: "12:15" })}>
          Bổ sung
        </SectionTitle>
        <Card className="px-4">{supplements.map(renderIntake)}</Card>

        <SectionTitle
          action={addButton({
            category: "checkup",
            frequency: "custom",
            customInterval: 6,
            customUnit: "month",
            time: "09:00",
            remindAgainMin: 0,
          })}
        >
          Nhắc khám
        </SectionTitle>
        <Card className="px-4">{appointments.map((c) => renderCheckup(c, true))}</Card>

        <SectionTitle
          action={addButton({
            category: "checkup",
            frequency: "yearly",
            time: "08:00",
            remindAgainMin: 0,
          })}
        >
          Định kỳ
        </SectionTitle>
        <Card className="px-4">{periodic.map((c) => renderCheckup(c, false))}</Card>
      </Box>

      <PostponeDialog occurrence={postponing} onClose={() => setPostponing(null)} />
      {(editing || preset) && (
        <TaskFormDialog
          task={editing}
          preset={preset ?? undefined}
          onClose={() => {
            setEditing(null);
            setPreset(null);
          }}
        />
      )}
    </Box>
  );
}
