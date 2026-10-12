"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { colors } from "@/theme/tokens";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box className="PageHeader flex items-start justify-between gap-3 px-5 pb-4 pt-6">
      <Box className="min-w-0">
        {subtitle && (
          <Typography variant="body2" sx={{ color: colors.muted, fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
      </Box>
      <Box className="flex shrink-0 items-center gap-1">
        {action}
        <IconButton component={Link} href="/settings" aria-label="Cài đặt">
          <SettingsOutlinedIcon sx={{ color: colors.ink }} />
        </IconButton>
      </Box>
    </Box>
  );
}
