"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { useAppData } from "@/context/AppDataContext";
import { colors } from "@/theme/tokens";

const liters = (ml: number): string => String(Number((ml / 1000).toFixed(2)));

export default function WaterCard() {
  const { today, water, settings, addWater } = useAppData();
  const ml = water[today] ?? 0;
  const target = settings.waterTargetMl;
  const percent = Math.min(100, Math.round((ml / target) * 100));

  return (
    <Card className="WaterCard p-4">
      <Box className="flex items-center justify-between gap-3">
        <Box className="flex items-center gap-3">
          <Box
            className="flex h-10 w-10 items-center justify-center rounded-md"
            sx={{ bgcolor: colors.primarySoft }}
          >
            <WaterDropRoundedIcon sx={{ color: colors.primary }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: colors.muted }}>
              Nước uống
            </Typography>
            <Typography variant="h3" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {liters(ml)}/{liters(target)}L
            </Typography>
          </Box>
        </Box>
        <Box className="flex items-center gap-1">
          <IconButton
            size="small"
            onClick={() => addWater(-settings.waterStepMl)}
            disabled={ml === 0}
            aria-label="Bớt nước"
          >
            <RemoveRoundedIcon fontSize="small" />
          </IconButton>
          <Button variant="contained" onClick={() => addWater(settings.waterStepMl)}>
            +{settings.waterStepMl}ml
          </Button>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: colors.line }}
      />
    </Card>
  );
}
