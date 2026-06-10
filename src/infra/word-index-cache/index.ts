import {
  deserializeWordIndex,
  serializeWordIndex,
} from "../../domain/word-index";
import { WordIndex } from "../../domain/word-index/types";

/**
 * WordIndex の永続キャッシュ (chrome.storage.local)。
 *
 * インデックスは 30 分 throttle のフルビルドでしか更新されないため、キャッシュも
 * ビルド成功のたびに**丸ごと置き換える**だけでよい。差分書き込みや無効化の
 * 管理は不要で、SW wake 直後の初回サジェストがブックマーク全件走査を待たずに
 * 返せるようになる。
 *
 * load が null を返すケース (未保存・バージョン不一致・形式不正) では呼び出し側
 * (WordIndexService) がフル再構築にフォールバックする。
 */

const STORAGE_KEY = "wordIndexCache";

export async function loadWordIndexCache(): Promise<WordIndex | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY];
  if (data === undefined) return null;
  return deserializeWordIndex(data);
}

export async function saveWordIndexCache(index: WordIndex): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: serializeWordIndex(index),
  });
}
