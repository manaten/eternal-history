/**
 * Settings persistence using Chrome Storage Sync API
 */

export interface SearchSettings {
  /** Whether to group results with the same URL */
  groupByUrl: boolean;
  /** Whether to group results with the same title */
  groupByTitle: boolean;
}

export interface Settings {
  search: SearchSettings;
}

const DEFAULT_SETTINGS: Settings = {
  search: {
    groupByUrl: false,
    groupByTitle: false,
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
const saveSettings = async (settings: Settings): Promise<void> => {
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

export { DEFAULT_SETTINGS };
