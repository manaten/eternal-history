import { FC, useState } from "react";

import { buildWordIndex, lookupSuggestions } from "../../../domain/word-index";
import { bookmarkHistoryStore } from "../../../infra/bookmark-history-store";
import { requestRebuildIndex } from "../../../util/suggest";
import {
  analyzeTexts,
  approximateMapSizeBytes,
  approximateWordIndexSizeBytes,
  bucketByCount,
  bucketByLength,
  filterNoise,
  topWords,
} from "../../../util/wordAnalysis";
import { Button } from "../../common/Button";

const COUNT_THRESHOLDS = [1, 2, 5, 10, 30, 100];
const TOP_N = 30;
const MIN_COUNT = 2;
const SUGGEST_LIMIT = 10;
const LOOKUP_ITERATIONS = 1000;
const SAMPLE_QUERIES = ["to", "検索", "Gi", "あ", "GitH"];

type Status =
  | { kind: "idle" }
  | { kind: "running"; label: string }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * インクリメンタルサジェスト関連のデバッグツール。
 *
 * - "Rebuild word index" — background の WordIndex をフル再構築する。
 *   ユーザーがブックマークを手動編集して index が古くなった等のリカバリ用。
 * - "Analyze vocabulary" — ブックマーク全件を解析し各段の所要時間・分布を console に出す。
 *   サジェスト品質や性能の調査用。
 */
export const DebugTools: FC = () => {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleRebuild = async () => {
    setStatus({ kind: "running", label: "Rebuilding index..." });
    try {
      const result = await requestRebuildIndex();
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
    setStatus({ kind: "running", label: "Analyzing..." });
    try {
      console.group("[DebugTools] vocabulary analysis");
      await bookmarkHistoryStore.initialize();

      const t0 = performance.now();
      const items = await bookmarkHistoryStore.getAll();
      const t1 = performance.now();
      console.log(
        `[1] fetch + deserialize all bookmarks: ${(t1 - t0).toFixed(1)} ms  (N=${items.length})`,
      );

      const titles = items.map((it) => it.title);
      const result = analyzeTexts(titles);
      const t2 = performance.now();
      console.log(`[2] segment + count: ${(t2 - t1).toFixed(1)} ms`);

      const sizeBytes = approximateMapSizeBytes(result.wordCounts);
      console.log(
        `[3] raw result:\n` +
          `    totalChars  : ${result.totalChars.toLocaleString()}\n` +
          `    totalTokens : ${result.totalTokens.toLocaleString()}\n` +
          `    uniqueWords : ${result.wordCounts.size.toLocaleString()}\n` +
          `    map size    : ~${(sizeBytes / 1024).toFixed(1)} KB`,
      );

      console.log(
        "[4] count distribution (>=N の語数):",
        Object.fromEntries(
          bucketByCount(result.wordCounts, COUNT_THRESHOLDS).map((b) => [
            `>=${b.threshold}`,
            b.uniqueWords,
          ]),
        ),
      );

      console.log(
        "[5] length distribution:",
        Object.fromEntries(
          bucketByLength(result.wordCounts).map((b) => [
            `${b.length}文字`,
            `${b.uniqueWords} (${(b.ratio * 100).toFixed(1)}%)`,
          ]),
        ),
      );

      const filtered = filterNoise(result.wordCounts, MIN_COUNT);
      const filteredSize = approximateMapSizeBytes(filtered);
      console.log(
        `[6] filtered (1文字/2文字英かなのみ/count<${MIN_COUNT}):\n` +
          `    uniqueWords : ${filtered.size.toLocaleString()} ` +
          `(removed ${(result.wordCounts.size - filtered.size).toLocaleString()})\n` +
          `    map size    : ~${(filteredSize / 1024).toFixed(1)} KB`,
      );

      console.log(`[7] top ${TOP_N} words (filtered):`);
      console.table(
        topWords(filtered, TOP_N).map(([word, count]) => ({ word, count })),
      );

      // 本実装 (domain/word-index) と同じ方法で WordIndex を構築
      const t3 = performance.now();
      const wordIndex = buildWordIndex(titles);
      const t4 = performance.now();
      console.log(
        `[8] buildWordIndex (本実装): ${(t4 - t3).toFixed(1)} ms\n` +
          `    uniqueWords : ${wordIndex.wordCounts.size.toLocaleString()}\n` +
          `    prefixes    : ${wordIndex.prefixIndex.size.toLocaleString()}\n` +
          `    total size  : ~${(approximateWordIndexSizeBytes(wordIndex) / 1024).toFixed(1)} KB`,
      );

      console.log(
        `[9] lookup benchmark (${LOOKUP_ITERATIONS} iterations per query):`,
      );
      const lookupResults = SAMPLE_QUERIES.map((query) => {
        const start = performance.now();
        const final =
          Array.from({ length: LOOKUP_ITERATIONS }, () =>
            lookupSuggestions(wordIndex, query, SUGGEST_LIMIT),
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
        message: `Analysis complete (see console). uniqueWords=${filtered.size.toLocaleString()}`,
      });
    } catch (e) {
      console.error("[DebugTools] analysis failed:", e);
      setStatus({ kind: "error", message: String(e) });
    }
  };

  const isRunning = status.kind === "running";

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
          {status.kind === "running" && status.label === "Rebuilding index..."
            ? "Rebuilding..."
            : "Rebuild word index"}
        </Button>
        <Button
          type='button'
          variant='secondary'
          onClick={handleAnalyze}
          disabled={isRunning}
        >
          {status.kind === "running" && status.label === "Analyzing..."
            ? "Analyzing..."
            : "Analyze vocabulary"}
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
