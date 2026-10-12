"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShoppingBasketOutlinedIcon from "@mui/icons-material/ShoppingBasketOutlined";
import PageHeader from "@/components/PageHeader";
import ShoppingDialog from "@/components/ShoppingDialog";
import { useAppData } from "@/context/AppDataContext";
import { dayOfWeek, WEEKDAY_LONG, WEEKDAY_SHORT } from "@/lib/date";
import { FOOD_RULES, MEAL_SLOT_LABEL, menuWeekIndex } from "@/lib/defaults";
import type { MealSlot, MenuPlan } from "@/lib/types";
import { colors } from "@/theme/tokens";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function MealsScreen() {
  const { today, menu, updateMenu, tasks, isDone, toggleTask } = useAppData();
  const todayDow = dayOfWeek(today);
  const currentWeek = menuWeekIndex(menu.anchorMonday, today);
  const [week, setWeek] = useState<0 | 1>(currentWeek);
  const [dow, setDow] = useState(todayDow);
  const [editing, setEditing] = useState<MealSlot | null>(null);
  const [draft, setDraft] = useState("");
  const [shoppingOpen, setShoppingOpen] = useState(false);

  const dayMenu = menu.weeks[week]?.[dow];
  const isToday = week === currentWeek && dow === todayDow;

  const openEdit = (slot: MealSlot) => {
    setDraft(dayMenu?.[slot] ?? "");
    setEditing(slot);
  };

  const saveEdit = () => {
    if (!editing) return;
    const weeks = menu.weeks.map((weekMenu, index) =>
      index === week
        ? {
            ...weekMenu,
            [dow]: {
              ...(dayMenu ?? { breakfast: "", lunch: "", dinner: "", snack: "" }),
              [editing]: draft,
            },
          }
        : weekMenu,
    ) as MenuPlan["weeks"];
    updateMenu({ ...menu, weeks });
    setEditing(null);
  };

  return (
    <Box className="MealsScreen">
      <PageHeader
        title="Lịch ăn"
        subtitle={isToday ? `Tuần ${week + 1} · hôm nay` : `Tuần ${week + 1} · ${WEEKDAY_LONG[dow]}`}
      />

      <Box className="px-5">
        <Box className="mb-3 flex gap-2">
          {([0, 1] as const).map((w) => (
            <Chip
              key={w}
              label={w === currentWeek ? `Tuần ${w + 1} · nay` : `Tuần ${w + 1}`}
              onClick={() => setWeek(w)}
              color={w === week ? "primary" : "default"}
              variant={w === week ? "filled" : "outlined"}
            />
          ))}
        </Box>
        <Box className="mb-4 flex gap-2 overflow-x-auto">
          {WEEK_ORDER.map((d) => (
            <Chip
              key={d}
              label={d === todayDow ? "Nay" : WEEKDAY_SHORT[d]}
              onClick={() => setDow(d)}
              color={d === dow ? "primary" : "default"}
              variant={d === dow ? "filled" : "outlined"}
            />
          ))}
        </Box>

        <Box className="flex flex-col gap-3">
          {SLOTS.map((slot) => {
            const linkedTask = tasks.find((t) => t.mealSlot === slot && t.isActive);
            const eaten = linkedTask ? isDone(linkedTask.id, today) : false;
            return (
              <Card key={slot} className="p-4" sx={{ opacity: isToday && eaten ? 0.55 : 1 }}>
                <Box className="flex items-start justify-between gap-2">
                  <Box className="min-w-0">
                    <Typography variant="caption" sx={{ color: colors.muted, fontWeight: 600 }}>
                      {MEAL_SLOT_LABEL[slot]}
                      {linkedTask ? ` · ${linkedTask.time}` : ""}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        whiteSpace: "pre-line",
                        textDecoration: isToday && eaten ? "line-through" : "none",
                      }}
                    >
                      {dayMenu?.[slot] || "Chưa có món"}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => openEdit(slot)} aria-label="Sửa món">
                    <EditOutlinedIcon fontSize="small" sx={{ color: colors.muted }} />
                  </IconButton>
                </Box>
                {isToday && linkedTask && (
                  <Button
                    size="small"
                    variant={eaten ? "outlined" : "contained"}
                    startIcon={eaten ? <CheckRoundedIcon /> : undefined}
                    onClick={() => toggleTask(linkedTask, today)}
                    sx={{ mt: 1.5 }}
                  >
                    {eaten ? "Đã ăn" : "Đánh dấu đã ăn"}
                  </Button>
                )}
              </Card>
            );
          })}
        </Box>

        <Card className="mt-4 p-4">
          <Typography variant="caption" sx={{ color: colors.muted, fontWeight: 600 }}>
            5 điều không làm
          </Typography>
          {FOOD_RULES.map((rule) => (
            <Typography key={rule} variant="body2" sx={{ mt: 0.5 }}>
              {rule}
            </Typography>
          ))}
        </Card>

        <Button
          fullWidth
          size="large"
          variant="outlined"
          startIcon={<ShoppingBasketOutlinedIcon />}
          onClick={() => setShoppingOpen(true)}
          sx={{ mt: 3 }}
        >
          Đi chợ 2 tuần
        </Button>
      </Box>

      {editing && (
        <Dialog open onClose={() => setEditing(null)} fullWidth maxWidth="xs">
          <DialogTitle>
            {MEAL_SLOT_LABEL[editing]} · {WEEKDAY_LONG[dow]}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              multiline
              minRows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button color="inherit" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button variant="contained" onClick={saveEdit}>
              Lưu
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {shoppingOpen && <ShoppingDialog onClose={() => setShoppingOpen(false)} />}
    </Box>
  );
}
