import {
  WordIndex,
  WORD_INDEX_SCHEMA_VERSION,
} from "../../domain/word-index/types";

const STORAGE_KEY = "wordIndex";

/**
 * 永続化時の Map → Array 変換後の形。chrome.storage.local は JSON シリアライズ可能な
 * 値しか保存できないため、Map は配列ペアにエンコードする。
 */
interface SerializedWordIndex {
  schemaVersion: number;
  wordCounts: [string, number][];
  prefixIndex: [string, string[]][];
}

/**
 * 保存済みインデックスを読み込む。
 * 未保存 or スキーマバージョン不一致なら null を返し、呼び出し側でフル再構築させる。
 */
export async function loadWordIndex(): Promise<WordIndex | null> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const data = stored[STORAGE_KEY] as SerializedWordIndex | undefined;
  if (!data) return null;
  if (data.schemaVersion !== WORD_INDEX_SCHEMA_VERSION) return null;
  return {
    schemaVersion: data.schemaVersion,
    wordCounts: new Map(data.wordCounts),
    prefixIndex: new Map(data.prefixIndex),
  };
}

export async function saveWordIndex(index: WordIndex): Promise<void> {
  const serialized: SerializedWordIndex = {
    schemaVersion: index.schemaVersion,
    wordCounts: [...index.wordCounts],
    prefixIndex: [...index.prefixIndex],
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: serialized });
}

export async function clearWordIndex(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
