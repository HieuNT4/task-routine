"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import { colors } from "@/theme/tokens";

const ITEMS = [
  { href: "/", label: "Hôm nay", icon: <TodayRoundedIcon /> },
  { href: "/checklist", label: "Lịch", icon: <ChecklistRoundedIcon /> },
  { href: "/tracking", label: "Theo dõi", icon: <MonitorWeightOutlinedIcon /> },
  { href: "/meals", label: "Ăn uống", icon: <RestaurantRoundedIcon /> },
  { href: "/health", label: "Thuốc", icon: <MedicationOutlinedIcon /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const active = ITEMS.findIndex((i) => i.href === pathname);

  return (
    <Paper
      className="BottomNav fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-[480px]"
      sx={{ borderTop: `1px solid ${colors.line}`, pb: "var(--safe-bottom)" }}
    >
      <BottomNavigation value={active} showLabels sx={{ height: "var(--bottom-nav-height)" }}>
        {ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            icon={item.icon}
            sx={{
              minWidth: 0,
              color: colors.muted,
              "&.Mui-selected": { color: colors.primary },
              "& .MuiBottomNavigationAction-label": { fontSize: 11, mt: 0.25 },
              "& .MuiBottomNavigationAction-label.Mui-selected": { fontSize: 11 },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
