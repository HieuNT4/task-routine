"use client";

import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AppDataProvider } from "@/context/AppDataContext";
import { muiTheme } from "@/theme/muiTheme";
import NotificationScheduler from "./NotificationScheduler";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <AppDataProvider>
          <NotificationScheduler />
          {children}
        </AppDataProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
