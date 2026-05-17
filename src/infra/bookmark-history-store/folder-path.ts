import { getBookmarkCached } from "../chrome/bookmark";

/**
 * Bookmark を「Eternal History」ルートからのパスとして解釈し、
 * フォルダ階層 (YYYY/MM/DD/HH) から訪問時刻を復元します。
 *
 * メタデータを持たないレガシーブックマーク向けのフォールバック。
 * パースに失敗した場合は bookmark.dateAdded、それも無ければ現在時刻を返します。
 */
export async function getLastVisitTimeFromPath(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
  rootFolderTitle: string,
): Promise<number> {
  try {
    const getPathParts = async (
      currentId: string | undefined,
    ): Promise<string[]> => {
      if (!currentId) {
        return [];
      }

      const parentNode = await getBookmarkCached(currentId);
      if (!parentNode || parentNode.title === rootFolderTitle) {
        return [];
      }

      const restPath = await getPathParts(parentNode.parentId);
      return [...restPath, parentNode.title];
    };

    const pathParts = await getPathParts(bookmark.parentId);

    // pathParts は [year, month, day, hour] の順番
    const [year, month, day, hour] = pathParts;
    if (year && month && day && hour) {
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1, // monthは0ベース
        parseInt(day),
        parseInt(hour),
      );
      return date.getTime();
    }
  } catch (error) {
    console.warn("Failed to parse date from bookmark path:", error);
  }

  // フォールバック: dateAddedを使用
  return bookmark.dateAdded || Date.now();
}
