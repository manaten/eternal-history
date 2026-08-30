/**
 * Settings persistence using Chrome Storage Sync API
 */

export type ThemeColor = "emerald" | "blue" | "lime" | "red" | "purple";

interface SearchSettings {
  /** Whether to group results with the same URL */
  groupByUrl: boolean;
  /** Whether to group results with the same title */
  groupByTitle: boolean;
}

export interface Settings {
  theme: ThemeColor;
  search: SearchSettings;
}
