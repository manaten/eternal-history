import {
  deserializeWordIndex,
  PersistedWordIndex,
  serializeWordIndex,
  WordIndex,
} from "../../domain/word-index";

/**
 * WordIndex の永続キャッシュ (chrome.storage.local)。
 *
 * インデックスはフル再構築でしか更新されないため、キャッシュもビルド成功の
 * たびに**丸ごと置き換える**だけでよい。差分書き込みや無効化の管理は不要で、
 * SW wake 直後の初回サジェストがブックマーク全件走査を待たずに返せるようになる。
 * 鮮度は builtAt を使った stale-while-revalidate (WordIndexService 側) で担保する。
 *
 * load が null を返すケース (未保存・バージョン不一致・形式不正) では呼び出し側
 * (WordIndexService) がフル再構築にフォールバックする。
 *
 * 既知の制限: chrome.storage.local は既定 10MB。語彙インデックスが上限に達する
 * のは数十万ユニーク語規模で実用上は遠いが、save 失敗 (quota 等) は warn のみで
 * 古いキャッシュが残る。恒常的に失敗するようなら manifest への unlimitedStorage
 * 追加を検討する。
 */

const STORAGE_KEY = "wordIndexCache";

export async function loadWordIndexCache(): Promise<PersistedWordIndex | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY];
  if (data === undefined) return null;
  return deserializeWordIndex(data);
}

export async function saveWordIndexCache(
  index: WordIndex,
  builtAt: number,
): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: serializeWordIndex(index, builtAt),
  });
}
