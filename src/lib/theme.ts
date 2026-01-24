import { ThemeColor } from "../types/Settings";

/**
 * Apply theme by setting data-theme attribute on document root
 */
export const applyTheme = (theme: ThemeColor): void => {
  document.documentElement.setAttribute("data-theme", theme);
};
