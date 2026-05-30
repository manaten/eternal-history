import {
  buildWordIndex,
  lookupSuggestions,
  WordIndex,
} from "../../domain/word-index";
import {
  RebuildIndexResponse,
  RuntimeRequest,
  SuggestResponse,
} from "../../types/messages";

/**
 * background SW における WordIndex のライフサイクル管理。
 *
 * 設計方針: **差分更新を持たず、都度フル再構築する**。
 *
 * - 構築は always-fresh: ブックマーク全件から都度 build する。差分更新 API は持たない。
 *   これにより onVisited × rebuild の race やタイトル更新の二重カウントが構造的に
 *   発生しない (一度の build がスナップショットを取って終わるだけ)。
 *
 * - 連続発火の coalescing: ビルド実行中に新たな {@link scheduleRebuild} 要求が来た
 *   場合は `pending` フラグを立てるだけで何もしない。実行中ビルドが終わったあと
 *   pending が立っていたらもう一度ビルドする。最大で「currentBuild + nextBuild」の
 *   2 連発に集約される。
 *
 * - onVisited からのトリガーは debounce する: ブラウジング中の頻発する onVisited で
 *   毎回ビルドが走らないよう、最後のトリガーから N 秒経ってから実体ビルドを開始する。
 *
 * - getIndex (suggest 経路): キャッシュされた `latestIndex` があれば即返す。
 *   無ければビルドを起動して待つ。ビルド失敗時はキャッシュをクリアして次回再試行。
 */

const DEFAULT_SUGGEST_LIMIT = 10;

/**
 * onVisited からの scheduleRebuild を集約する debounce 窓。
 * 訪問してから「サジェスト候補に出てくる」までの最大遅延 ≒ DEBOUNCE_MS + ビルド時間。
 */
const REBUILD_DEBOUNCE_MS = 5000;

export interface WordIndexServiceDeps {
  /** Index 構築のソース。タイトル文字列の列を返す。 */
  getSourceTexts: () => Promise<readonly string[]>;
}

export interface WordIndexService {
  /** キャッシュ済 index を返す。無ければビルドして待つ。 */
  getIndex: () => Promise<WordIndex>;
  /**
   * 即時再構築。debounce を skip する。
   * 既にビルド実行中なら pending を立て、完了後に追加ビルドが走ったあとの最終 index を待つ。
   */
  rebuild: () => Promise<WordIndex>;
  /**
   * 再構築を debounce してから依頼する。連続呼出は最大で「実行中 1 件 + 次に予約 1 件」に集約。
   */
  scheduleRebuild: () => void;
}

/**
 * 純粋な stateful サービスを生成する。chrome.runtime へのバインドはしないので、
 * テストや別 consumer から再利用しやすい。メッセージリスナーは
 * {@link makeWordIndexMessageListener} 経由で別途登録する。
 */
export function createWordIndexService(
  deps: WordIndexServiceDeps,
): WordIndexService {
  // eslint-disable-next-line functional/no-let
  let latestIndex: WordIndex | null = null;
  // eslint-disable-next-line functional/no-let
  let inFlightBuild: Promise<WordIndex> | null = null;
  // eslint-disable-next-line functional/no-let
  let pending = false;
  // eslint-disable-next-line functional/no-let
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function runBuildLoop(): Promise<WordIndex> {
    // pending が立っている間はビルドを連続実行する (1 段だけ「次」を許す)。
    // 先頭で pending をクリアするので、ビルド中に来たトリガーは次ラウンドで拾われる。
    do {
      pending = false;
      const t0 = performance.now();
      const texts = await deps.getSourceTexts();
      const built = buildWordIndex(texts);
      latestIndex = built;
      console.log(
        `WordIndex built: ${built.wordCounts.size} words from ${texts.length} texts in ${(performance.now() - t0).toFixed(0)}ms`,
      );
    } while (pending);
    inFlightBuild = null;
    return latestIndex!;
  }

  function rebuild(): Promise<WordIndex> {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (inFlightBuild) {
      pending = true;
      return inFlightBuild;
    }
    inFlightBuild = runBuildLoop().catch((e) => {
      // 失敗時はキャッシュをクリアして次回再試行できるようにする
      inFlightBuild = null;
      latestIndex = null;
      throw e;
    });
    return inFlightBuild;
  }

  function scheduleRebuild(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      rebuild().catch((e) => console.error("Scheduled rebuild failed:", e));
    }, REBUILD_DEBOUNCE_MS);
  }

  function getIndex(): Promise<WordIndex> {
    if (latestIndex) return Promise.resolve(latestIndex);
    return rebuild();
  }

  return { getIndex, rebuild, scheduleRebuild };
}

/**
 * chrome.runtime.onMessage の listener を組み立てる。background.ts で
 * `chrome.runtime.onMessage.addListener(makeWordIndexMessageListener(service))` のように
 * 明示的に登録する。
 *
 * service 構築と listener 登録を分離したことで、テストや別実装 (Omnibox provider 等) からも
 * service だけを差し替えて使える。
 */
export function makeWordIndexMessageListener(
  service: WordIndexService,
): (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean {
  return (message, _sender, sendResponse) => {
    const msg = message as RuntimeRequest | null | undefined;
    if (msg?.type === "suggest") {
      void (async () => {
        try {
          const index = await service.getIndex();
          const suggestions = lookupSuggestions(
            index,
            msg.query,
            msg.limit ?? DEFAULT_SUGGEST_LIMIT,
          );
          sendResponse({ suggestions } satisfies SuggestResponse);
        } catch (e) {
          console.error("suggest failed:", e);
          // service-level エラーは error フィールドで透過し、client に throw させる。
          // UI 側で「state を更新しない」復旧パスに乗せるため、空配列を成功扱いで
          // 返してはいけない。
          sendResponse({
            suggestions: [],
            error: String(e),
          } satisfies SuggestResponse);
        }
      })();
      return true;
    }
    if (msg?.type === "rebuild-index") {
      void (async () => {
        try {
          const t0 = performance.now();
          const built = await service.rebuild();
          sendResponse({
            ok: true,
            wordCount: built.wordCounts.size,
            elapsedMs: performance.now() - t0,
          } satisfies RebuildIndexResponse);
        } catch (e) {
          console.error("Failed to rebuild WordIndex:", e);
          sendResponse({
            ok: false,
            error: String(e),
          } satisfies RebuildIndexResponse);
        }
      })();
      return true;
    }
    return false;
  };
}
