/**
 * Settings persistence using Chrome Storage Sync API
 */

interface SearchSettings {
  /** Whether to group results with the same URL */
  groupByUrl: boolean;
  /** Whether to group results with the same title */
  groupByTitle: boolean;
}

export interface Settings {
  search: SearchSettings;
}
