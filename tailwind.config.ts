import type { Config } from "tailwindcss";
import { colors, fontFamily, radius } from "./src/theme/tokens";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  corePlugins: {
    // MUI CssBaseline handles the reset
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: colors.ink,
        muted: colors.muted,
        line: colors.line,
        surface: colors.surface,
        primary: {
          DEFAULT: colors.primary,
          dark: colors.primaryDark,
          soft: colors.primarySoft,
        },
        danger: {
          DEFAULT: colors.danger,
          soft: colors.dangerSoft,
        },
        success: colors.success,
      },
      borderRadius: {
        sm: `${radius.sm}px`,
        md: `${radius.md}px`,
        lg: `${radius.lg}px`,
        xl: `${radius.xl}px`,
      },
      fontFamily: {
        sans: fontFamily,
      },
    },
  },
  plugins: [],
};

export default config;
