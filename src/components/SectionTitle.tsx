import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { colors } from "@/theme/tokens";

interface SectionTitleProps {
  children: ReactNode;
  action?: ReactNode;
  danger?: boolean;
}

export default function SectionTitle({ children, action, danger = false }: SectionTitleProps) {
  return (
    <Box className="SectionTitle mb-2 mt-6 flex items-center justify-between">
      <Typography
        variant="caption"
        component="h2"
        sx={{
          color: danger ? colors.danger : colors.muted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {children}
      </Typography>
      {action}
    </Box>
  );
}
