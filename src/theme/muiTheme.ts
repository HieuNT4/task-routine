"use client";

import { createTheme } from "@mui/material/styles";
import { colors, fontFamily, radius, spacingUnit } from "./tokens";

export const muiTheme = createTheme({
  spacing: spacingUnit,
  shape: { borderRadius: radius.md },
  palette: {
    mode: "light",
    primary: { main: colors.primary, dark: colors.primaryDark, contrastText: colors.white },
    error: { main: colors.danger },
    success: { main: colors.success },
    text: { primary: colors.ink, secondary: colors.muted },
    divider: colors.line,
    background: { default: colors.surface, paper: colors.white },
  },
  typography: {
    fontFamily: fontFamily.join(","),
    h1: { fontSize: 28, fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: 22, fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: 18, fontWeight: 600, lineHeight: 1.3 },
    subtitle1: { fontSize: 16, fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: 16, lineHeight: 1.5 },
    body2: { fontSize: 14, lineHeight: 1.5 },
    caption: { fontSize: 12, lineHeight: 1.4 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.surface, WebkitTapHighlightColor: "transparent" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: radius.md, minHeight: 44 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: radius.lg, borderColor: colors.line } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: radius.xl } },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: radius.sm, fontWeight: 500 } },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true, size: "medium" },
    },
  },
});
