import { createWordIndex, WordIndex } from "../../common/word-index";

/**
 * メモリ上の index にビルド時刻 (epoch ms) を添えたもの。
 * load の戻り値であり、service の鮮度判定 (stale-while-revalidate) で使う。
 */
export interface PersistedWordIndex {
  index: WordIndex;
  builtAt: number;
}

/**
 * WordIndex の永続キャッシュ (chrome.storage.local)。
 *
 * インデックスはフル再構築でしか更新されないため、キャッシュもビルド成功の
 * たびに**丸ごと置き換える**だけでよい。差分書き込みや無効化の管理は不要で、
 * SW wake 直後の初回サジェストがブックマーク全件走査を待たずに返せるようになる。
 * 鮮度は builtAt を使った stale-while-revalidate (WordIndexService 側) で担保する。
 *
 * 永続化フォーマット (SerializedWordIndex) の組み立て・検証はこの infra 層の責務。
 * domain へは WordIndex 型と、wordCounts から index を復元する {@link createWordIndex}
 * だけに依存する (prefixIndex の作り方など index の内部構造は domain に閉じたまま)。
 *
 * load が null を返すケース (未保存・バージョン不一致・形式不正) では呼び出し側
 * (WordIndexService) がフル再構築にフォールバックする。
 *
 * 既知の制限: chrome.storage.local は既定 10MB。語彙インデックスが上限に達する
 * のは数十万ユニーク語規模で実用上は遠いが、save 失敗 (quota 等) は warn のみで
 * 古いキャッシュが残る。恒常的に失敗するようなら manifest への unlimitedStorage
 * 追加を検討する。
 */

/**
 * 永続フォーマットのバージョン。index の構築ルール (isNoiseWord の判定や
 * canonical 化など domain 側のロジック) が変わって古いキャッシュが意味をなさなく
 * なったらインクリメントする。バージョン不一致のキャッシュは load が null を返し、
 * フル再構築にフォールバックする。
 */
const CACHE_VERSION = 1;

const STORAGE_KEY = "wordIndexCache";

/**
 * chrome.storage.local に書き出す JSON 表現。
 * prefixIndex は wordCounts からの派生データなので保存しない (load 時に
 * {@link createWordIndex} で再導出する)。これでキャッシュサイズと整合性管理が楽になる。
 */
interface SerializedWordIndex {
  v: number;
  /** ビルド時刻 (epoch ms)。stale-while-revalidate の鮮度判定に使う。 */
  builtAt: number;
  /** [canonical word, total count] のペア列 */
  words: [string, number][];
}

export async function loadWordIndexCache(): Promise<PersistedWordIndex | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY];
  if (data === undefined) return null;
  return deserialize(data);
}

export async function saveWordIndexCache(
  index: WordIndex,
  builtAt: number,
): Promise<void> {
  const serialized: SerializedWordIndex = {
    v: CACHE_VERSION,
    builtAt,
    words: [...index.wordCounts.entries()],
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: serialized });
}

/**
 * 永続データを PersistedWordIndex に復元する。
 * バージョン不一致・形式不正 (v 不一致 / builtAt が有限数でない / words が
 * [string, number] の配列でない / count が有限数でない) は null を返し、呼び出し側の
 * フル再構築に任せる。
 *
 * 検証は「正常な保存出力の形」かどうかに限定する。同じ単語が複数回現れるような
 * 意味的な破損までは弾かず、{@link createWordIndex} の Map 上書きで graceful に
 * 畳む (どのみち保存元が壊れているので、整合した index を作れれば十分)。
 */
function deserialize(data: unknown): PersistedWordIndex | null {
  const serialized = data as SerializedWordIndex | null | undefined;
  if (
    serialized?.v !== CACHE_VERSION ||
    typeof serialized.builtAt !== "number" ||
    !Number.isFinite(serialized.builtAt) ||
    !Array.isArray(serialized.words)
  ) {
    return null;
  }
  for (const entry of serialized.words) {
    if (
      !Array.isArray(entry) ||
      typeof entry[0] !== "string" ||
      typeof entry[1] !== "number" ||
      !Number.isFinite(entry[1])
    ) {
      return null;
    }
  }
  return {
    index: createWordIndex(serialized.words),
    builtAt: serialized.builtAt,
  };
}
