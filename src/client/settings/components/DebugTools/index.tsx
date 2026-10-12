import { FC, useState } from "react";

import {
  analyzeRawTokens,
  approximateMapSizeBytes,
  bucketByCount,
  bucketByLength,
  topWords,
} from "./analysis";
import { HistoryItem } from "../../../../common/history/domain/types";
import { RebuildIndexResponse } from "../../../../common/messages";
import {
  buildWordIndex,
  lookupSuggestions,
} from "../../../../common/word-index";
import { Button } from "../../../ui/Button";

const COUNT_THRESHOLDS = [1, 2, 5, 10, 30, 100];
const TOP_N = 30;
const SUGGEST_LIMIT = 10;
const LOOKUP_ITERATIONS = 1000;
const SAMPLE_QUERIES = [
  "to",
  "プラ",
  "Co",
  "検索",
  "Gi",
  "あ",
  "tok",
  "GitH",
  "プラス",
];

type Status =
  | { kind: "idle" }
  | { kind: "rebuilding" }
  | { kind: "analyzing" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * インクリメンタルサジェスト関連のデバッグツール (dev ビルドのみ表示)。
 *
 * - "Rebuild word index" — background SW の WordIndex キャッシュを破棄し、
 *   ブックマークから再構築させる。手動編集等で在庫が古くなった時用。
 * - "Analyze vocabulary" — ブックマーク全件を解析し、各段の所要時間・サイズ・
 *   分布・top 語・lookup ベンチを console に出力する。本実装 (`domain/word-index`) を
 *   そのまま呼ぶので、production と挙動が乖離しない。
 */
interface DebugToolsProps {
  /** WordIndex のフル再構築を依頼する副作用 (background SW へのメッセージ送信)。 */
  onRebuildIndex: () => Promise<RebuildIndexResponse>;
  /**
   * Analyze ボタン用に全履歴を取得する副作用。
   * 実装は重い処理 (10 万件想定) なので、Analyze 実行時にのみ呼ばれる。
   */
  onGetAllHistoryItems: () => Promise<HistoryItem[]>;
}

export const DebugTools: FC<DebugToolsProps> = ({
  onRebuildIndex,
  onGetAllHistoryItems,
}) => {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleRebuild = async () => {
    setStatus({ kind: "rebuilding" });
    try {
      const result = await onRebuildIndex();
      if (result.ok) {
        setStatus({
          kind: "done",
          message: `Rebuilt: ${result.wordCount?.toLocaleString()} words in ${result.elapsedMs?.toFixed(0)}ms`,
        });
      } else {
        setStatus({
          kind: "error",
          message: `Failed: ${result.error ?? "unknown"}`,
        });
      }
    } catch (e) {
      setStatus({ kind: "error", message: String(e) });
    }
  };

  const handleAnalyze = async () => {
    setStatus({ kind: "analyzing" });
    try {
      console.group("[DebugTools] vocabulary analysis");

      const t0 = performance.now();
      const items = await onGetAllHistoryItems();
      const t1 = performance.now();
      console.log(
        `[1] fetch + deserialize all bookmarks: ${(t1 - t0).toFixed(1)} ms  (N=${items.length})`,
      );

      const titles = items.map((it) => it.title);
      const raw = analyzeRawTokens(titles);
      const t2 = performance.now();
      console.log(`[2] raw segment + count: ${(t2 - t1).toFixed(1)} ms`);
      console.log(
        `[3] raw result:\n` +
          `    totalChars  : ${raw.totalChars.toLocaleString()}\n` +
          `    totalTokens : ${raw.totalTokens.toLocaleString()}\n` +
          `    uniqueWords : ${raw.wordCounts.size.toLocaleString()}\n` +
          `    map size    : ~${(approximateMapSizeBytes(raw.wordCounts) / 1024).toFixed(1)} KB`,
      );

      console.log(
        "[4] count distribution (>=N の語数):",
        Object.fromEntries(
          bucketByCount(raw.wordCounts, COUNT_THRESHOLDS).map((b) => [
            `>=${b.threshold}`,
            b.uniqueWords,
          ]),
        ),
      );

      console.log(
        "[5] length distribution:",
        Object.fromEntries(
          bucketByLength(raw.wordCounts).map((b) => [
            `${b.length}文字`,
            `${b.uniqueWords} (${(b.ratio * 100).toFixed(1)}%)`,
          ]),
        ),
      );

      // production logic 経由でフィルタ済み index を構築
      const tBuildStart = performance.now();
      const index = buildWordIndex(titles);
      const tBuildEnd = performance.now();
      const indexSize =
        approximateMapSizeBytes(index.wordCounts) +
        approximateMapSizeBytes(index.prefixIndex);
      console.log(
        `[6] production buildWordIndex: ${(tBuildEnd - tBuildStart).toFixed(1)} ms\n` +
          `    uniqueWords : ${index.wordCounts.size.toLocaleString()} ` +
          `(filtered ${(raw.wordCounts.size - index.wordCounts.size).toLocaleString()})\n` +
          `    total size  : ~${(indexSize / 1024).toFixed(1)} KB`,
      );

      console.log(`[7] top ${TOP_N} words (filtered):`);
      console.table(
        topWords(index.wordCounts, TOP_N).map(([word, count]) => ({
          word,
          count,
        })),
      );

      const listLens = [...index.prefixIndex.values()].map((l) => l.length);
      const maxListLen = listLens.length > 0 ? Math.max(...listLens) : 0;
      const avgListLen =
        listLens.length > 0
          ? listLens.reduce((a, b) => a + b, 0) / listLens.length
          : 0;
      console.log(
        `[8] prefix index buckets:\n` +
          `    prefixes    : ${index.prefixIndex.size.toLocaleString()}\n` +
          `    avg list len: ${avgListLen.toFixed(1)}\n` +
          `    max list len: ${maxListLen}`,
      );

      console.log(
        `[9] lookup benchmark (${LOOKUP_ITERATIONS} iterations per query, production lookupSuggestions):`,
      );
      const lookupResults = SAMPLE_QUERIES.map((query) => {
        const start = performance.now();
        const final =
          Array.from({ length: LOOKUP_ITERATIONS }, () =>
            lookupSuggestions(index, query, SUGGEST_LIMIT),
          ).at(-1) ?? [];
        const elapsed = performance.now() - start;
        return {
          query,
          "avg μs/lookup": ((elapsed * 1000) / LOOKUP_ITERATIONS).toFixed(2),
          "result count": final.length,
          "top match": final[0] ?? "—",
        };
      });
      console.table(lookupResults);

      console.groupEnd();
      setStatus({
        kind: "done",
        message: `Analysis complete (see console). filtered words=${index.wordCounts.size.toLocaleString()}`,
      });
    } catch (e) {
      console.error("[DebugTools] analysis failed:", e);
      setStatus({ kind: "error", message: String(e) });
    }
  };

  const isRunning = status.kind === "rebuilding" || status.kind === "analyzing";

  return (
    <section
      className='
        rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-6
        shadow-md
      '
    >
      <h2 className='mb-2 text-lg font-semibold text-amber-900'>
        Debug Tools (dev only)
      </h2>
      <p className='mb-4 text-sm text-amber-800'>
        サジェスト用 WordIndex の再構築・解析。Analyze の詳細結果は DevTools
        コンソールに出力されます。
      </p>
      <div className='flex flex-wrap gap-3'>
        <Button
          type='button'
          variant='primary'
          onClick={handleRebuild}
          disabled={isRunning}
        >
          {status.kind === "rebuilding"
            ? "Rebuilding..."
            : "Rebuild word index"}
        </Button>
        <Button
          type='button'
          variant='secondary'
          onClick={handleAnalyze}
          disabled={isRunning}
        >
          {status.kind === "analyzing" ? "Analyzing..." : "Analyze vocabulary"}
        </Button>
      </div>
      {status.kind === "done" && (
        <p className='mt-3 text-sm text-emerald-700'>{status.message}</p>
      )}
      {status.kind === "error" && (
        <p className='mt-3 text-sm text-red-700'>{status.message}</p>
      )}
    </section>
  );
};
