"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useAppData } from "@/context/AppDataContext";
import { WEEKDAY_SHORT } from "@/lib/date";
import { CATEGORY_LABEL } from "@/lib/defaults";
import { newId } from "@/lib/storage";
import type { CustomUnit, Frequency, Task, TaskCategory } from "@/lib/types";
import { colors } from "@/theme/tokens";

interface TaskFormDialogProps {
  /** Existing task to edit; null = create */
  task: Task | null;
  /** Prefill for new tasks */
  preset?: Partial<Task>;
  onClose: () => void;
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Hàng ngày" },
  { value: "weekly", label: "Theo thứ trong tuần" },
  { value: "monthly", label: "Hàng tháng" },
  { value: "yearly", label: "Hàng năm" },
  { value: "custom", label: "Tùy chỉnh (N ngày/tuần/tháng một lần)" },
];

const UNIT_OPTIONS: { value: CustomUnit; label: string }[] = [
  { value: "day", label: "ngày" },
  { value: "week", label: "tuần" },
  { value: "month", label: "tháng" },
];

const REMIND_OPTIONS = [0, 5, 10, 15, 30, 60];

// Monday-first order for the weekday picker
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const blankTask = (today: string, preset?: Partial<Task>): Task => ({
  id: newId(),
  name: "",
  time: "08:00",
  frequency: "daily",
  daysOfWeek: [],
  dayOfMonth: 1,
  monthOfYear: 1,
  monthsOfYear: [],
  customInterval: 2,
  customUnit: "week",
  nextDue: today,
  isActive: true,
  category: "routine",
  remindAgainMin: 15,
  createdAt: new Date().toISOString(),
  ...preset,
});

const toggleSx = {
  flex: 1,
  py: 0.75,
  borderColor: colors.line,
  "&.Mui-selected": { bgcolor: colors.primary, color: colors.white },
  "&.Mui-selected:hover": { bgcolor: colors.primaryDark },
};

export default function TaskFormDialog({ task, preset, onClose }: TaskFormDialogProps) {
  const { today, saveTask, deleteTask } = useAppData();
  // Parents mount this dialog only while open, so initial state is enough
  const [draft, setDraft] = useState<Task>(() => (task ? { ...task } : blankTask(today, preset)));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const weeklyInvalid = draft.frequency === "weekly" && (draft.daysOfWeek ?? []).length === 0;
  const invalid = !draft.name.trim() || !draft.time || weeklyInvalid;

  const handleSave = () => {
    if (invalid) return;
    const cleaned: Task = { ...draft, name: draft.name.trim() };
    if (cleaned.frequency !== "custom" && task?.frequency === "custom") {
      cleaned.nextDue = undefined;
    }
    if (cleaned.frequency === "custom" && task && task.frequency !== "custom") {
      cleaned.nextDue = cleaned.nextDue ?? today;
    }
    saveTask(cleaned);
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTask(task.id);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" className="TaskFormDialog" scroll="body">
      <DialogTitle sx={{ pb: 1 }}>{task ? "Sửa task" : "Thêm task"}</DialogTitle>
      <DialogContent>
        <Box component="form" className="flex flex-col gap-4 pt-2" onSubmit={(e) => e.preventDefault()}>
          <TextField
            label="Tên task"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus={!task}
          />

          <Box className="flex gap-3">
            <TextField
              type="time"
              label="Giờ"
              value={draft.time}
              onChange={(e) => set("time", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Nhóm"
              value={draft.category}
              onChange={(e) => set("category", e.target.value as TaskCategory)}
            >
              {(Object.keys(CATEGORY_LABEL) as TaskCategory[]).map((c) => (
                <MenuItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            select
            label="Tần suất"
            value={draft.frequency}
            onChange={(e) => set("frequency", e.target.value as Frequency)}
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          {draft.frequency === "weekly" && (
            <Box>
              <Typography variant="caption" sx={{ color: weeklyInvalid ? colors.danger : colors.muted }}>
                Chọn các thứ lặp lại
              </Typography>
              <ToggleButtonGroup
                value={draft.daysOfWeek ?? []}
                onChange={(_, v: number[]) => set("daysOfWeek", v)}
                size="small"
                className="mt-1 flex w-full"
              >
                {WEEK_ORDER.map((d) => (
                  <ToggleButton key={d} value={d} sx={toggleSx}>
                    {WEEKDAY_SHORT[d]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {(draft.frequency === "monthly" || draft.frequency === "yearly") && (
            <Box className="flex gap-3">
              <TextField
                type="number"
                label="Ngày trong tháng"
                value={draft.dayOfMonth ?? 1}
                onChange={(e) => set("dayOfMonth", Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                slotProps={{ htmlInput: { min: 1, max: 31, inputMode: "numeric" } }}
              />
              {draft.frequency === "yearly" && (
                <TextField
                  select
                  label="Tháng"
                  value={draft.monthOfYear ?? 1}
                  onChange={(e) => set("monthOfYear", Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <MenuItem key={m} value={m}>
                      Tháng {m}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          )}

          {draft.frequency === "monthly" && (
            <Box>
              <Typography variant="caption" sx={{ color: colors.muted }}>
                Chỉ các tháng (bỏ trống = mọi tháng)
              </Typography>
              <ToggleButtonGroup
                value={draft.monthsOfYear ?? []}
                onChange={(_, v: number[]) => set("monthsOfYear", v)}
                size="small"
                className="mt-1 grid w-full grid-cols-6"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <ToggleButton key={m} value={m} sx={toggleSx}>
                    T{m}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {draft.frequency === "custom" && (
            <>
              <Box className="flex items-center gap-3">
                <TextField
                  type="number"
                  label="Mỗi"
                  value={draft.customInterval ?? 1}
                  onChange={(e) => set("customInterval", Math.max(1, Number(e.target.value) || 1))}
                  slotProps={{ htmlInput: { min: 1, inputMode: "numeric" } }}
                />
                <TextField
                  select
                  label="Đơn vị"
                  value={draft.customUnit ?? "day"}
                  onChange={(e) => set("customUnit", e.target.value as CustomUnit)}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <MenuItem key={u.value} value={u.value}>
                      {u.label}/lần
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                type="date"
                label="Lần tới"
                value={draft.nextDue ?? today}
                onChange={(e) => set("nextDue", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}

          <TextField
            select
            label="Nhắc lại nếu chưa làm"
            value={draft.remindAgainMin ?? 0}
            onChange={(e) => set("remindAgainMin", Number(e.target.value))}
          >
            {REMIND_OPTIONS.map((m) => (
              <MenuItem key={m} value={m}>
                {m === 0 ? "Không nhắc lại" : `Sau ${m} phút`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Ghi chú"
            value={draft.note ?? ""}
            onChange={(e) => set("note", e.target.value || undefined)}
            multiline
            minRows={2}
          />

          <FormControlLabel
            control={
              <Switch checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            }
            label="Đang bật"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: task ? "space-between" : "flex-end" }}>
        {task && (
          <Button color="error" onClick={handleDelete}>
            {confirmDelete ? "Chắc chắn xoá?" : "Xoá"}
          </Button>
        )}
        <Box className="flex gap-2">
          <Button onClick={onClose} color="inherit">
            Huỷ
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={invalid}>
            Lưu
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
