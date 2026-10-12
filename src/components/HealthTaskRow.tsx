"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Task } from "@/lib/types";
import { colors } from "@/theme/tokens";

interface HealthTaskRowProps {
  task: Task;
  title?: string;
  detail: string;
  detailDanger?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  actions?: ReactNode;
}

export default function HealthTaskRow({
  task,
  title,
  detail,
  detailDanger = false,
  dimmed = false,
  onClick,
  actions,
}: HealthTaskRowProps) {
  return (
    <Box
      className="HealthTaskRow flex items-center gap-3 border-0 border-b border-solid border-line py-3 last:border-b-0"
      sx={{ opacity: dimmed ? 0.5 : 1 }}
    >
      <Box className="min-w-0 flex-1" onClick={onClick} sx={{ cursor: onClick ? "pointer" : "default" }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {title ?? task.name}
        </Typography>
        <Typography variant="caption" sx={{ color: detailDanger ? colors.danger : colors.muted }}>
          {detail}
        </Typography>
      </Box>
      <Box className="flex shrink-0 items-center gap-1">{actions}</Box>
    </Box>
  );
}
