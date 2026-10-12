"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAppData } from "@/context/AppDataContext";
import type { Metrics } from "@/lib/types";
import { colors } from "@/theme/tokens";

interface FormState {
  weight: string;
  waist: string;
  sleepH: string;
  sleepM: string;
  freshness: number;
}

const fromMetrics = (m?: Metrics): FormState => ({
  weight: m?.weightKg?.toString() ?? "",
  waist: m?.waistCm?.toString() ?? "",
  sleepH: m?.sleepMinutes !== undefined ? String(Math.floor(m.sleepMinutes / 60)) : "",
  sleepM: m?.sleepMinutes !== undefined ? String(m.sleepMinutes % 60) : "",
  freshness: m?.freshness ?? 7,
});

const toNumber = (s: string): number | undefined => {
  const n = Number(s.replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
};

export default function MetricsForm() {
  const { today, metrics, saveMetrics } = useAppData();
  const [date, setDate] = useState(today);
  const [form, setForm] = useState<FormState>(() => fromMetrics(metrics.find((m) => m.date === today)));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(fromMetrics(metrics.find((m) => m.date === date)));
    setSaved(false);
    // Only refill when switching day, not after each save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const h = toNumber(form.sleepH);
    const m = toNumber(form.sleepM) ?? 0;
    await saveMetrics({
      date,
      weightKg: toNumber(form.weight),
      waistCm: toNumber(form.waist),
      sleepMinutes: h !== undefined ? Math.round(h * 60 + m) : undefined,
      freshness: form.freshness,
    });
    setSaved(true);
  };

  return (
    <Card className="MetricsForm p-4">
      <Box component="form" className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <Box className="flex items-center justify-between gap-3">
          <Typography variant="subtitle1">Chỉ số buổi sáng</Typography>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value || today)}
            slotProps={{ htmlInput: { max: today } }}
            sx={{ maxWidth: 170 }}
          />
        </Box>

        <Box className="grid grid-cols-2 gap-3">
          <TextField
            label="Cân nặng"
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
            slotProps={{
              htmlInput: { inputMode: "decimal" },
              input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> },
            }}
          />
          <TextField
            label="Vòng bụng"
            value={form.waist}
            onChange={(e) => set("waist", e.target.value)}
            slotProps={{
              htmlInput: { inputMode: "decimal" },
              input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> },
            }}
          />
          <TextField
            label="Ngủ (giờ)"
            value={form.sleepH}
            onChange={(e) => set("sleepH", e.target.value)}
            slotProps={{
              htmlInput: { inputMode: "numeric" },
              input: { endAdornment: <InputAdornment position="end">h</InputAdornment> },
            }}
          />
          <TextField
            label="Ngủ (phút)"
            value={form.sleepM}
            onChange={(e) => set("sleepM", e.target.value)}
            slotProps={{
              htmlInput: { inputMode: "numeric" },
              input: { endAdornment: <InputAdornment position="end">ph</InputAdornment> },
            }}
          />
        </Box>

        <Box>
          <Box className="flex items-center justify-between">
            <Typography variant="body2" sx={{ color: colors.muted }}>
              Sảng khoái
            </Typography>
            <Typography variant="subtitle1" sx={{ color: colors.primary }}>
              {form.freshness}/10
            </Typography>
          </Box>
          <Slider
            value={form.freshness}
            onChange={(_, v) => set("freshness", v as number)}
            min={1}
            max={10}
            step={1}
            marks
            aria-label="Mức sảng khoái"
          />
        </Box>

        <Button variant="contained" size="large" onClick={handleSave}>
          {saved ? "Đã lưu" : "Lưu"}
        </Button>
      </Box>
    </Card>
  );
}
