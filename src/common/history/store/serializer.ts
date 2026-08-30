import { HistoryItem } from "../domain/types";

/**
 * Bookmark のタイトル内に埋め込むメタデータ。
 * Bookmark という保存形式に特有の符号化方式であり、ドメインの一部ではない。
 */
export interface BookmarkMetadata {
  v: number; // version
  t?: number; // precise timestamp
  vc?: number; // visit count (optional for future use)
}

const METADATA_SEPARATOR = "💾";
const CURRENT_VERSION = 1;

/**
 * Validates bookmark metadata structure
 */
function validateMetadata(data: unknown): data is BookmarkMetadata {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Version is required and must be a valid number
  if (typeof obj.v !== "number") {
    return false;
  }

  // Optional fields validation
  if (obj.t !== undefined && (typeof obj.t !== "number" || obj.t <= 0)) {
    return false;
  }
  if (obj.vc !== undefined && (typeof obj.vc !== "number" || obj.vc < 0)) {
    return false;
  }

  return true;
}

/**
 * Parses a bookmark title to extract clean title and metadata
 */
function parseBookmarkTitle(title: string): {
  cleanTitle: string;
  metadata?: BookmarkMetadata;
} {
  const separatorIndex = title.lastIndexOf(METADATA_SEPARATOR);
  if (separatorIndex === -1) {
    return { cleanTitle: title };
  }

  const cleanTitle = title.substring(0, separatorIndex).trim();
  const metadataPart = title.substring(
    separatorIndex + METADATA_SEPARATOR.length,
  );

  try {
    const metadata = JSON.parse(metadataPart);
    if (validateMetadata(metadata)) {
      return { cleanTitle, metadata };
    }
  } catch {
    // JSON parse error - treat as legacy title
  }

  return { cleanTitle: title };
}

/**
 * Serializes HistoryItem to bookmark format (title + url)
 */
export function serializeHistoryItemToBookmark(item: HistoryItem): {
  title: string;
  url: string;
} {
  const metadata = {
    v: CURRENT_VERSION,
    t: item.lastVisitTime,
    vc: item.visitCount,
  };
  const metadataJson = JSON.stringify(metadata);
  return {
    title: `${item.title} ${METADATA_SEPARATOR}${metadataJson}`,
    url: item.url,
  };
}

function faviconURL(u: string): string {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "32");
  return url.toString();
}

/**
 * Deserializes bookmark format to HistoryItem
 * Note: lastVisitTime may be 0 for legacy bookmarks without metadata;
 * callers may fall back to folder-based timestamp recovery in that case.
 */
export function deserializeBookmarkToHistoryItem(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
): HistoryItem {
  const { cleanTitle, metadata } = parseBookmarkTitle(bookmark.title);
  return {
    id: bookmark.id,
    url: bookmark.url ?? "",
    title: cleanTitle,
    lastVisitTime: metadata?.t ?? 0,
    visitCount: metadata?.vc ?? 1,
    domain: bookmark.url ? new URL(bookmark.url).hostname : "",
    favicon: bookmark.url ? faviconURL(bookmark.url) : undefined,
  };
}
