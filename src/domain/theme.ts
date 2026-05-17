import {
  getSettings,
  getThemeFromLocalStorage,
  saveSettings,
} from "./settings";
import { ThemeColor } from "../types/Settings";

/**
 * Apply theme by setting data-theme attribute on document root
 */
export const applyTheme = (theme: ThemeColor): void => {
  document.documentElement.setAttribute("data-theme", theme);
};

/**
 * Initialize theme on page load
 * - First, try to load from localStorage (synchronous, no flicker)
 * - If not found, load from chrome.storage.sync and cache to localStorage
 */
export const initializeTheme = (): void => {
  // Try synchronous load from localStorage
  const cachedTheme = getThemeFromLocalStorage();

  if (cachedTheme) {
    applyTheme(cachedTheme);
  } else {
    // Fallback to async load from chrome.storage.sync
    getSettings().then((settings) => {
      applyTheme(settings.theme);
      saveSettings(settings);
    });
  }
};
