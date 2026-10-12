// Single source of truth for design tokens, shared by MUI theme and Tailwind config.
export const colors = {
  white: "#FFFFFF",
  ink: "#111827",
  muted: "#6B7280",
  line: "#E5E7EB",
  surface: "#F9FAFB",
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  primarySoft: "#EFF6FF",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
  success: "#10B981",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

// MUI spacing unit (px). Tailwind spacing uses 4px, so theme.spacing(1) === Tailwind "2".
export const spacingUnit = 8;

export const fontFamily = [
  "var(--font-inter)",
  "-apple-system",
  "BlinkMacSystemFont",
  '"SF Pro Text"',
  '"Segoe UI"',
  "Roboto",
  "sans-serif",
];
