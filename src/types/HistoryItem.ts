export interface BookmarkMetadata {
  v: number; // version
  t?: number; // precise timestamp
  vc?: number; // visit count (optional for future use)
}

export type HistoryItem = {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
  domain: string;
};
