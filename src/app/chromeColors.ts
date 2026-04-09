export const APP_CHROME_THEME_COLORS = {
  light: "#FAFAF9",
  dark: "#13161B",
} as const;

export type AppChromeTheme = keyof typeof APP_CHROME_THEME_COLORS;

export function getAppChromeThemeColor(theme: AppChromeTheme) {
  return APP_CHROME_THEME_COLORS[theme];
}
