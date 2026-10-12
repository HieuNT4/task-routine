"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAppData } from "@/context/AppDataContext";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  const { ready } = useAppData();

  return (
    <Box
      className="AppShell mx-auto min-h-screen w-full max-w-[480px] bg-white"
      sx={{
        pt: "var(--safe-top)",
        pb: "calc(var(--bottom-nav-height) + var(--safe-bottom) + 24px)",
      }}
    >
      {ready ? (
        children
      ) : (
        <Box className="flex min-h-[60vh] items-center justify-center">
          <CircularProgress size={28} />
        </Box>
      )}
      <BottomNav />
    </Box>
  );
}
