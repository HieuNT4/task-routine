"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fab from "@mui/material/Fab";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "@/components/PageHeader";
import PostponeDialog from "@/components/PostponeDialog";
import SectionTitle from "@/components/SectionTitle";
import TaskFormDialog from "@/components/TaskFormDialog";
import TaskItem from "@/components/TaskItem";
import { useAppData } from "@/context/AppDataContext";
import { addDays, dateRange, diffDays, formatShortDate, parseISODate, WEEKDAY_SHORT } from "@/lib/date";
import { CATEGORY_LABEL } from "@/lib/defaults";
import { frequencyLabel, nextOccurrence, sortByTime, upcomingByDay } from "@/lib/schedule";
import type { Occurrence, Task, TaskCategory } from "@/lib/types";
import { colors } from "@/theme/tokens";

const DAYS_AHEAD = 7;

export default function ChecklistScreen() {
  const { today, tasks, isDone, toggleTask, saveTask } = useAppData();
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(today);
  const [postponing, setPostponing] = useState<Occurrence | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const days = useMemo(() => dateRange(today, DAYS_AHEAD), [today]);
  const dayItems = useMemo(
    () => upcomingByDay(tasks, selected, 1, today)[0]?.items ?? [],
    [tasks, selected, today],
  );

  // Infrequent tasks (monthly / yearly / custom) whose next date falls after the 7-day window
  const later = useMemo(() => {
    const windowEnd = addDays(today, DAYS_AHEAD);
    return tasks
      .filter((t) => t.isActive && t.frequency !== "daily" && t.frequency !== "weekly")
      .map((t) => {
        const date = nextOccurrence(t, today, today);
        return date && date >= windowEnd ? { task: t, date, overdue: false } : null;
      })
      .filter((o): o is Occurrence => o !== null)
      .sort((a, b) => a.date.localeCompare(b.date) || sortByTime(a, b));
  }, [tasks, today]);

  const grouped = useMemo(() => {
    const map = new Map<TaskCategory, Task[]>();
    [...tasks]
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((t) => map.set(t.category, [...(map.get(t.category) ?? []), t]));
    return Array.from(map.entries());
  }, [tasks]);

  return (
    <Box className="ChecklistScreen">
      <PageHeader title="Lịch" subtitle="Checklist theo ngày" />

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="fullWidth"
        sx={{ px: 2, borderBottom: `1px solid ${colors.line}` }}
      >
        <Tab label="Theo ngày" />
        <Tab label="Tất cả task" />
      </Tabs>

      {tab === 0 && (
        <Box className="px-3">
          <Box
            className="flex gap-2 overflow-x-auto px-2 py-4"
            sx={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
          >
            {days.map((d) => {
              const date = parseISODate(d);
              const active = d === selected;
              return (
                <Chip
                  key={d}
                  onClick={() => setSelected(d)}
                  label={
                    <Box className="flex flex-col items-center">
                      <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {d === today ? "Nay" : WEEKDAY_SHORT[date.getDay()]}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {date.getDate()}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    height: 56,
                    minWidth: 48,
                    borderRadius: "14px",
                    bgcolor: active ? colors.primary : colors.surface,
                    color: active ? colors.white : colors.ink,
                    border: `1px solid ${active ? colors.primary : colors.line}`,
                    "&:hover": { bgcolor: active ? colors.primaryDark : colors.line },
                  }}
                />
              );
            })}
          </Box>

          <Box className="px-2">
            <SectionTitle>
              {selected === today ? "Hôm nay" : formatShortDate(selected)} · {dayItems.length} task
            </SectionTitle>
          </Box>
          {dayItems.map((o) => (
            <TaskItem
              key={`${o.task.id}-${o.date}`}
              occurrence={o}
              done={isDone(o.task.id, o.date)}
              readOnly={o.date > today}
              onToggle={() => toggleTask(o.task, o.date)}
              onPostpone={() => setPostponing(o)}
            />
          ))}

          {later.length > 0 && (
            <>
              <Box className="px-2">
                <SectionTitle>Sắp tới</SectionTitle>
              </Box>
              {later.map((o) => (
                <TaskItem
                  key={`later-${o.task.id}`}
                  occurrence={o}
                  done={false}
                  readOnly
                  showDate
                  onPostpone={() => setPostponing(o)}
                />
              ))}
            </>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box className="px-3">
          {grouped.map(([category, list]) => (
            <Box key={category}>
              <Box className="px-2">
                <SectionTitle>{CATEGORY_LABEL[category]}</SectionTitle>
              </Box>
              <List disablePadding>
                {list.map((t) => {
                  const next = nextOccurrence(t, today, today);
                  const inDays = next ? diffDays(today, next) : null;
                  return (
                    <ListItemButton
                      key={t.id}
                      onClick={() => setEditing(t)}
                      sx={{ borderRadius: 3, opacity: t.isActive ? 1 : 0.5, px: 1.5 }}
                    >
                      <ListItemText
                        primary={`${t.time}  ${t.name}`}
                        secondary={`${frequencyLabel(t)}${
                          inDays === null
                            ? ""
                            : inDays === 0
                              ? " · hôm nay"
                              : ` · ${formatShortDate(next ?? today)}`
                        }`}
                        slotProps={{
                          primary: { sx: { fontWeight: 500, whiteSpace: "pre" } },
                          secondary: { sx: { color: colors.muted } },
                        }}
                      />
                      <Switch
                        edge="end"
                        checked={t.isActive}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => saveTask({ ...t, isActive: e.target.checked })}
                        inputProps={{ "aria-label": `Bật/tắt ${t.name}` }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="Thêm task"
        onClick={() => setCreating(true)}
        sx={{
          position: "fixed",
          right: "max(20px, calc((100vw - 480px) / 2 + 20px))",
          bottom: "calc(var(--bottom-nav-height) + var(--safe-bottom) + 16px)",
        }}
      >
        <AddRoundedIcon />
      </Fab>

      <PostponeDialog occurrence={postponing} onClose={() => setPostponing(null)} />
      {(creating || editing) && (
        <TaskFormDialog
          task={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </Box>
  );
}
