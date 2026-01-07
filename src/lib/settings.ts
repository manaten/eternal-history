/**
 * Settings persistence using Chrome Storage Sync API
 */

export type Theme = "light" | "dark" | "system";

export interface SearchSettings {
  /** Number of results per page */
  resultsPerPage: number;
  /** Whether to highlight matches in search results */
  highlightMatches: boolean;
}

export interface Settings {
  theme: Theme;
  search: SearchSettings;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  search: {
    resultsPerPage: 100,
    highlightMatches: true,
  },
};

const STORAGE_KEY = "settings";

/**
 * Get current settings from Chrome Storage
 */
export const getSettings = async (): Promise<Settings> => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<Settings> | undefined;

  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  // Merge with defaults to handle new settings added in future versions
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    search: {
      ...DEFAULT_SETTINGS.search,
      ...stored.search,
    },
  };
};

/**
 * Save settings to Chrome Storage
 */
export const saveSettings = async (settings: Settings): Promise<void> => {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
};

/**
 * Update partial settings
 */
export const updateSettings = async (
  partial: Partial<Settings>,
): Promise<Settings> => {
  const current = await getSettings();
  const updated: Settings = {
    ...current,
    ...partial,
    search: {
      ...current.search,
      ...(partial.search ?? {}),
    },
  };
  await saveSettings(updated);
  return updated;
};

/**
 * Reset settings to defaults
 */
export const resetSettings = async (): Promise<Settings> => {
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

/**
 * Subscribe to settings changes
 */
export const onSettingsChange = (
  callback: (settings: Settings) => void,
): (() => void) => {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName === "sync" && changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue as
        | Partial<Settings>
        | undefined;
      const newSettings: Settings = {
        ...DEFAULT_SETTINGS,
        ...newValue,
        search: {
          ...DEFAULT_SETTINGS.search,
          ...newValue?.search,
        },
      };
      callback(newSettings);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
};

export { DEFAULT_SETTINGS };
