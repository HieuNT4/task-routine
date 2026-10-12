"use client";

import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AppDataProvider } from "@/context/AppDataContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { muiTheme } from "@/theme/muiTheme";
import AppShell from "./AppShell";
import AuthScreen from "./screens/AuthScreen";
import NotificationScheduler from "./NotificationScheduler";

function AuthGate({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <AppDataProvider>
      <NotificationScheduler />
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
