"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAppData } from "@/context/AppDataContext";
import { addDays, formatShortDate } from "@/lib/date";
import { addInterval, frequencyLabel } from "@/lib/schedule";
import type { Occurrence } from "@/lib/types";
import { colors } from "@/theme/tokens";

interface PostponeDialogProps {
  occurrence: Occurrence | null;
  onClose: () => void;
}

export default function PostponeDialog({ occurrence, onClose }: PostponeDialogProps) {
  const { today, postponeTask } = useAppData();
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (occurrence) setTarget(addDays(occurrence.date < today ? today : occurrence.date, 1));
  }, [occurrence, today]);

  if (!occurrence) return null;
  const { task, date } = occurrence;
  const isCustom = task.frequency === "custom";
  const base = date < today ? today : date;
  const quick = [
    { label: "Ngày mai", value: addDays(base, 1) },
    { label: "+2 ngày", value: addDays(base, 2) },
    { label: "+1 tuần", value: addDays(base, 7) },
  ];

  const handleConfirm = () => {
    if (!target) return;
    postponeTask(task, date, target);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" className="PostponeDialog">
      <DialogTitle sx={{ pb: 1 }}>Dời ngày</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">{task.name}</Typography>
        <Typography variant="body2" sx={{ color: colors.muted, mb: 2 }}>
          {formatShortDate(date)} · {task.time} · {frequencyLabel(task)}
        </Typography>

        <Box className="mb-4 flex flex-wrap gap-2">
          {quick.map((q) => (
            <Chip
              key={q.label}
              label={q.label}
              onClick={() => setTarget(q.value)}
              color={target === q.value ? "primary" : "default"}
              variant={target === q.value ? "filled" : "outlined"}
            />
          ))}
        </Box>

        <TextField
          type="date"
          label="Ngày mới"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
        />

        <Typography variant="body2" sx={{ color: colors.muted, mt: 2 }}>
          {isCustom
            ? `Chu kỳ sẽ tính lại từ ngày mới: sau khi làm, lần kế tiếp là ${
                target
                  ? formatShortDate(
                      addInterval(target, task.customInterval ?? 1, task.customUnit ?? "day"),
                    )
                  : "…"
              }.`
            : "Chỉ dời lần này. Tần suất gốc của task giữ nguyên."}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!target}>
          Dời sang {target ? formatShortDate(target) : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
