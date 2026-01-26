import { Platform } from "react-native";

const collegeNavy = "#0A2240";
const collegeGold = "#FFB81C";
const electricBlue = "#00A3E0";
const championGreen = "#00C853";
const alertRed = "#E53935";

export const Colors = {
  light: {
    text: "#0A2240",
    textSecondary: "#4A5568",
    buttonText: "#FFFFFF",
    tabIconDefault: "#718096",
    tabIconSelected: collegeNavy,
    link: electricBlue,
    primary: collegeNavy,
    accent: collegeGold,
    secondary: electricBlue,
    success: championGreen,
    warning: alertRed,
    backgroundRoot: "#F8FAFC",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#EDF2F7",
    backgroundTertiary: "#E2E8F0",
    border: "#CBD5E0",
    overlay: "rgba(10, 34, 64, 0.6)",
    cardGradientStart: "#0A2240",
    cardGradientEnd: "#1E3A5F",
    goldGradientStart: "#FFB81C",
    goldGradientEnd: "#FFA000",
  },
  dark: {
    text: "#F7FAFC",
    textSecondary: "#A0AEC0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#718096",
    tabIconSelected: collegeGold,
    link: "#4FC3F7",
    primary: collegeGold,
    accent: collegeGold,
    secondary: electricBlue,
    success: "#69F0AE",
    warning: "#FF7043",
    backgroundRoot: "#0A1628",
    backgroundDefault: "#0F2744",
    backgroundSecondary: "#1A365D",
    backgroundTertiary: "#2A4365",
    border: "#2D3748",
    overlay: "rgba(0, 0, 0, 0.8)",
    cardGradientStart: "#1A365D",
    cardGradientEnd: "#2A4365",
    goldGradientStart: "#FFB81C",
    goldGradientEnd: "#FFA000",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 72,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
