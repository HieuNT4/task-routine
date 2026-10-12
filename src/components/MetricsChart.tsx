"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { useAppData } from "@/context/AppDataContext";
import { addDays, dateRange, formatMinutesAsDuration, parseISODate } from "@/lib/date";
import type { Metrics } from "@/lib/types";
import { colors } from "@/theme/tokens";

type MetricKey = "weightKg" | "waistCm" | "sleepMinutes" | "freshness";

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "weightKg", label: "Cân nặng", unit: "kg" },
  { key: "waistCm", label: "Vòng bụng", unit: "cm" },
  { key: "sleepMinutes", label: "Giờ ngủ", unit: "" },
  { key: "freshness", label: "Sảng khoái", unit: "/10" },
];

const formatValue = (key: MetricKey, v: number | null): string => {
  if (v === null) return "—";
  if (key === "sleepMinutes") return formatMinutesAsDuration(v);
  return `${Number.isInteger(v) ? v : v.toFixed(1)}`;
};

export default function MetricsChart() {
  const { today, metrics } = useAppData();
  const [range, setRange] = useState<7 | 30>(7);
  const [metric, setMetric] = useState<MetricKey>("weightKg");

  const { labels, values } = useMemo(() => {
    const days = dateRange(addDays(today, -(range - 1)), range);
    const byDate = new Map<string, Metrics>(metrics.map((m) => [m.date, m]));
    return {
      labels: days.map((d) => {
        const date = parseISODate(d);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      values: days.map((d) => byDate.get(d)?.[metric] ?? null),
    };
  }, [metrics, metric, range, today]);

  const meta = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  const hasData = values.some((v) => v !== null);
  const yDomain = useMemo(() => {
    const present = values.filter((v): v is number => v !== null);
    if (metric === "freshness") return { min: 0, max: 10 };
    if (present.length === 0) return {};
    const lo = Math.min(...present);
    const hi = Math.max(...present);
    const pad = Math.max((hi - lo) * 0.2, metric === "sleepMinutes" ? 30 : 1);
    return { min: Math.floor(lo - pad), max: Math.ceil(hi + pad) };
  }, [metric, values]);
  const latest = [...values].reverse().find((v) => v !== null) ?? null;

  return (
    <Card className="MetricsChart p-4">
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="caption" sx={{ color: colors.muted }}>
            {meta.label} gần nhất
          </Typography>
          <Typography variant="h3">
            {formatValue(metric, latest)}
            {latest !== null && metric !== "sleepMinutes" ? ` ${meta.unit}` : ""}
          </Typography>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={range}
          onChange={(_, v: 7 | 30 | null) => v && setRange(v)}
        >
          <ToggleButton value={7}>Tuần</ToggleButton>
          <ToggleButton value={30}>Tháng</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box className="mt-3 flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <Chip
            key={m.key}
            label={m.label}
            size="small"
            onClick={() => setMetric(m.key)}
            color={metric === m.key ? "primary" : "default"}
            variant={metric === m.key ? "filled" : "outlined"}
          />
        ))}
      </Box>

      {hasData ? (
        <LineChart
          height={220}
          margin={{ left: 40, right: 24, top: 16, bottom: 28 }}
          xAxis={[
            {
              scaleType: "point",
              data: labels,
              tickInterval: (_, i) => range === 7 || i % 5 === 0,
            },
          ]}
          yAxis={[
            {
              ...yDomain,
              valueFormatter: (v: number) =>
                metric === "sleepMinutes" ? formatMinutesAsDuration(v) : String(v),
            },
          ]}
          series={[
            {
              data: values,
              color: colors.primary,
              connectNulls: true,
              showMark: true,
              valueFormatter: (v) => formatValue(metric, v),
            },
          ]}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        />
      ) : (
        <Box className="flex h-[180px] items-center justify-center">
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Chưa có dữ liệu trong {range === 7 ? "7" : "30"} ngày qua
          </Typography>
        </Box>
      )}
    </Card>
  );
}
