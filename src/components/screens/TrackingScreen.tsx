"use client";

import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import MetricsChart from "@/components/MetricsChart";
import MetricsForm from "@/components/MetricsForm";
import PageHeader from "@/components/PageHeader";
import SectionTitle from "@/components/SectionTitle";
import { useAppData } from "@/context/AppDataContext";
import { formatMinutesAsDuration, formatShortDate } from "@/lib/date";
import type { Metrics } from "@/lib/types";
import { colors } from "@/theme/tokens";

const summary = (m: Metrics): string =>
  [
    m.weightKg !== undefined ? `${m.weightKg} kg` : null,
    m.waistCm !== undefined ? `${m.waistCm} cm` : null,
    m.sleepMinutes !== undefined ? `ngủ ${formatMinutesAsDuration(m.sleepMinutes)}` : null,
    m.freshness !== undefined ? `sảng khoái ${m.freshness}/10` : null,
  ]
    .filter(Boolean)
    .join(" · ");

export default function TrackingScreen() {
  const { metrics } = useAppData();
  const recent = [...metrics].reverse().slice(0, 10);

  return (
    <Box className="TrackingScreen">
      <PageHeader title="Theo dõi" subtitle="Cân nặng, vòng bụng, giấc ngủ" />
      <Box className="flex flex-col gap-4 px-5">
        <MetricsForm />
        <MetricsChart />
      </Box>

      <Box className="px-5">
        <SectionTitle>Gần đây</SectionTitle>
        {recent.length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Chưa có số liệu nào.
          </Typography>
        ) : (
          <List disablePadding>
            {recent.map((m) => (
              <ListItem key={m.date} disableGutters divider>
                <ListItemText
                  primary={formatShortDate(m.date)}
                  secondary={summary(m)}
                  slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
