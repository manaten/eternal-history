import pMap from "p-map";

/**
 * `chrome.bookmarks.get` の結果をモジュールスコープでメモ化したラッパー。
 * 検索時の親フォルダ走査で同じ ID への問い合わせが大量に発生するため、
 * 重複呼び出しを除去します。並列実行を考慮して in-flight の Promise を
 * 保持しています。
 *
 * 不整合が起こりうるのはユーザーが手動でフォルダを移動・改名した場合のみ。
 */
const bookmarkCache = new Map<
  string,
  Promise<chrome.bookmarks.BookmarkTreeNode | undefined>
>();

/**
 * `chrome.bookmarks.get` のキャッシュ付きラッパ。同一 ID への重複問い合わせを抑制する。
 * 存在しない ID の場合は `undefined` を返す (throw しない)。
 */
export async function getBookmarkCached(
  id: string,
): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
  const cached = bookmarkCache.get(id);
  if (cached) {
    return cached;
  }

  const promise = chrome.bookmarks.get(id).then(
    (nodes) => nodes[0],
    () => undefined,
  );
  // eslint-disable-next-line functional/immutable-data
  bookmarkCache.set(id, promise);
  return promise;
}

// Test helper
export function resetBookmarkCacheForTesting() {
  // eslint-disable-next-line functional/immutable-data
  bookmarkCache.clear();
}

/**
 * フォルダを取得または作成します。
 * 指定された親フォルダ内に指定されたタイトルのフォルダが存在する場合はそのIDを返し、
 * 存在しない場合は新しいフォルダを作成してそのIDを返します。
 */
export async function getOrCreateFolder(
  parentId: string | undefined,
  title: string,
): Promise<string> {
  const bookmarks = parentId
    ? await chrome.bookmarks.getChildren(parentId)
    : await chrome.bookmarks.search({ title });

  const existing = bookmarks.find((b) => !b.url && b.title === title);
  if (existing) {
    return existing.id;
  }

  const folder = await chrome.bookmarks.create({
    parentId,
    title,
  });
  return folder.id;
}

/**
 * 指定されたブックマークが特定のフォルダの配下にあるかどうかを判定します。
 * 直接の親子関係だけでなく、階層を遡って祖先フォルダも検索します。
 */
export async function isUnderFolder(
  bookmark: chrome.bookmarks.BookmarkTreeNode,
  folderId: string,
): Promise<boolean> {
  const checkParent = async (
    currentId: string | undefined,
  ): Promise<boolean> => {
    if (!currentId) {
      return false;
    }

    if (currentId === folderId) {
      return true;
    }

    const parent = await getBookmarkCached(currentId);
    return await checkParent(parent?.parentId);
  };

  return await checkParent(bookmark.parentId);
}

/**
 * 指定されたフォルダ内のすべてのブックマーク (URLを持つノード) を再帰的に取得します。
 * サブフォルダも含めて階層全体を検索し、フォルダ自体は除外してブックマークのみを返します。
 */
export async function getAllBookmarksInFolder(
  folderId: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  const children = await chrome.bookmarks.getChildren(folderId);
  const bookmarksArrays = await pMap(children, async (child) => {
    if (child.url) {
      return [child];
    } else {
      return await getAllBookmarksInFolder(child.id);
    }
  });
  return bookmarksArrays.flat();
}

/**
 * 指定された親フォルダ直下から URL が一致するブックマークを 1 件返します。
 */
export async function findBookmarkByUrlInFolder(
  folderId: string,
  url: string,
): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
  const children = await chrome.bookmarks.getChildren(folderId);
  return children.find((b) => b.url === url);
}

/** 指定された親フォルダ直下に新規ブックマークを作成する。 */
export async function createBookmark(
  parentId: string,
  title: string,
  url: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return await chrome.bookmarks.create({ parentId, title, url });
}

/** ブックマークのタイトルだけを更新する (URL は変更しない)。 */
export async function updateBookmarkTitle(
  id: string,
  title: string,
): Promise<void> {
  await chrome.bookmarks.update(id, { title });
}

/** ブックマークを 1 件削除する。フォルダの場合は配下も再帰削除される。 */
export async function removeBookmark(id: string): Promise<void> {
  await chrome.bookmarks.remove(id);
}

/**
 * タイトル/URL に対する Chrome 標準の全文検索。
 * 検索範囲はブックマーク全体で、特定フォルダ配下に絞りたい場合は呼び出し側で
 * {@link isUnderFolder} などで再フィルタする。
 */
export async function searchBookmarks(
  query: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return await chrome.bookmarks.search({ query });
}

/** URL の完全一致でブックマークを引く。 */
export async function searchBookmarksByUrl(
  url: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return await chrome.bookmarks.search({ url });
}
