"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { formatShortDate } from "@/lib/date";
import { frequencyLabel } from "@/lib/schedule";
import type { Occurrence } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";

interface TaskItemProps {
  occurrence: Occurrence;
  done: boolean;
  /** Not done and past due time — rendered in red */
  late?: boolean;
  /** Hide the checkbox (future dates) */
  readOnly?: boolean;
  showDate?: boolean;
  onToggle?: () => void;
  onPostpone?: () => void;
  onEdit?: () => void;
}

export default function TaskItem({
  occurrence,
  done,
  late = false,
  readOnly = false,
  showDate = false,
  onToggle,
  onPostpone,
  onEdit,
}: TaskItemProps) {
  const { task, overdue, movedFrom, date } = occurrence;
  const accent = late || overdue ? colors.danger : colors.ink;

  return (
    <Box
      className="TaskItem flex items-center gap-2 py-2 pl-1 pr-2"
      sx={{
        borderRadius: `${radius.md}px`,
        opacity: done ? 0.45 : 1,
        transition: "opacity 160ms ease",
        backgroundColor: (late || overdue) && !done ? colors.dangerSoft : "transparent",
      }}
    >
      {readOnly ? (
        <Box className="w-3" />
      ) : (
        <Checkbox
          checked={done}
          onChange={onToggle}
          inputProps={{ "aria-label": `Hoàn thành ${task.name}` }}
          sx={{ p: 1, "&.Mui-checked": { color: colors.primary } }}
        />
      )}

      <Typography
        variant="body2"
        sx={{
          width: 48,
          flexShrink: 0,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: late || overdue ? colors.danger : colors.muted,
        }}
      >
        {task.time}
      </Typography>

      <Box className="min-w-0 flex-1" onClick={readOnly ? undefined : onToggle}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: accent,
            textDecoration: done ? "line-through" : "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {task.name}
        </Typography>
        <Box className="mt-0.5 flex flex-wrap items-center gap-1">
          {showDate && (
            <Typography variant="caption" sx={{ color: colors.muted }}>
              {formatShortDate(date)} ·
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: colors.muted }}>
            {frequencyLabel(task)}
          </Typography>
          {overdue && (
            <Chip
              label="Quá hạn"
              size="small"
              sx={{ height: 20, fontSize: 11, bgcolor: colors.danger, color: colors.white }}
            />
          )}
          {movedFrom && (
            <Chip
              label={`Dời từ ${formatShortDate(movedFrom)}`}
              size="small"
              sx={{ height: 20, fontSize: 11, bgcolor: colors.primarySoft, color: colors.primary }}
            />
          )}
        </Box>
      </Box>

      {onPostpone && !done && (
        <IconButton size="small" onClick={onPostpone} aria-label={`Dời ngày ${task.name}`}>
          <EventRepeatRoundedIcon fontSize="small" sx={{ color: colors.muted }} />
        </IconButton>
      )}
      {onEdit && (
        <IconButton size="small" onClick={onEdit} aria-label={`Sửa ${task.name}`}>
          <EditOutlinedIcon fontSize="small" sx={{ color: colors.muted }} />
        </IconButton>
      )}
    </Box>
  );
}
