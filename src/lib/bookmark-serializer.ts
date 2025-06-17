import type { HistoryItem, BookmarkMetadata } from "../types/HistoryItem.ts";

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
    v: CURRENT_VERSION, // Ensure version is set
    t: item.lastVisitTime, // Use last visit time as timestamp
    vc: item.visitCount, // Use visit count
  };
  const metadataJson = JSON.stringify(metadata);
  return {
    title: `${item.title} ${METADATA_SEPARATOR}${metadataJson}`,
    url: item.url,
  };
}

/**
 * Deserializes bookmark format to HistoryItem
 * Note: This creates a partial HistoryItem - other fields like id, domain need to be set separately
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
    visitCount: metadata?.vc ?? 1, // Default to 1 if not specified
    domain: bookmark.url ? new URL(bookmark.url).hostname : "",
  };
}
