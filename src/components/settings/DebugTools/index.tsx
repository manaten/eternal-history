import { FC, useState } from "react";

import {
  bookmarkHistoryStore,
  convertBookmarksForDebug,
  getAllRawBookmarksForDebug,
} from "../../../infra/bookmark-history-store";
import {
  analyzeTexts,
  approximateMapSizeBytes,
  approximatePrefixIndexSizeBytes,
  bucketByCount,
  bucketByLength,
  buildPrefixIndex,
  filterNoise,
  lookupSuggestions,
  topWords,
} from "../../../util/wordAnalysis";
import { Button } from "../../common/Button";

const COUNT_THRESHOLDS = [1, 2, 5, 10, 30, 100];
const TOP_N = 30;
const MIN_COUNT = 2;
const SUGGEST_LIMIT = 10;
const LOOKUP_ITERATIONS = 1000;
const SAMPLE_QUERIES = [
  "to",
  "プラ",
  "東急",
  "Co",
  "検索",
  "Gi",
  "あ",
  "tok",
  "GitH",
  "プラス",
];

/**
 * インクリメンタルサジェストの実現可能性を測るための計測ボタン。
 * 全ブックマークを取得 → デシリアライズ → タイトルを Intl.Segmenter で分かち書き →
 * 単語頻度を集計し、各ステップの所要時間と分布を console に出力する。
 *
 * 結果は本実装の設計判断材料 (Map サイズ、ノイズ量、上位語の妥当性) として使う。
 */
export const DebugTools: FC = () => {
  const [running, setRunning] = useState(false);

  const handleAnalyze = async () => {
    setRunning(true);
    try {
      console.group("[DebugTools] vocabulary analysis");

      await bookmarkHistoryStore.initialize();

      const t0 = performance.now();
      const rawBookmarks = await getAllRawBookmarksForDebug();
      const t1 = performance.now();
      console.log(
        `[1] fetch all bookmarks: ${(t1 - t0).toFixed(1)} ms  (N=${rawBookmarks.length})`,
      );

      const items = await convertBookmarksForDebug(rawBookmarks);
      const t2 = performance.now();
      console.log(`[2] deserialize: ${(t2 - t1).toFixed(1)} ms`);

      const titles = items.map((it) => it.title);
      const result = analyzeTexts(titles);
      const t3 = performance.now();
      console.log(
        `[3] segment + count (Intl.Segmenter, titles only): ${(t3 - t2).toFixed(1)} ms`,
      );

      const sizeBytes = approximateMapSizeBytes(result.wordCounts);
      console.log(
        `[4] result:\n` +
          `    totalChars  : ${result.totalChars.toLocaleString()}\n` +
          `    totalTokens : ${result.totalTokens.toLocaleString()}\n` +
          `    uniqueWords : ${result.wordCounts.size.toLocaleString()}\n` +
          `    map size    : ~${(sizeBytes / 1024).toFixed(1)} KB (JSON×2, UTF-16 換算)`,
      );

      console.log(
        "[5] count distribution (>=N の語数):",
        Object.fromEntries(
          bucketByCount(result.wordCounts, COUNT_THRESHOLDS).map((b) => [
            `>=${b.threshold}`,
            b.uniqueWords,
          ]),
        ),
      );

      console.log(
        "[6] length distribution:",
        Object.fromEntries(
          bucketByLength(result.wordCounts).map((b) => [
            `${b.length}文字`,
            `${b.uniqueWords} (${(b.ratio * 100).toFixed(1)}%)`,
          ]),
        ),
      );

      console.log(`[7] top ${TOP_N} words (raw):`);
      console.table(
        topWords(result.wordCounts, TOP_N).map(([word, count]) => ({
          word,
          count,
        })),
      );

      // --- フィルタ後 ---
      const t4 = performance.now();
      const filtered = filterNoise(result.wordCounts, MIN_COUNT);
      const t5 = performance.now();
      const filteredSize = approximateMapSizeBytes(filtered);
      console.log(
        `[8] filter noise (1文字/2文字英かなのみ/count<${MIN_COUNT}): ${(t5 - t4).toFixed(1)} ms\n` +
          `    uniqueWords : ${filtered.size.toLocaleString()} ` +
          `(removed ${(result.wordCounts.size - filtered.size).toLocaleString()})\n` +
          `    map size    : ~${(filteredSize / 1024).toFixed(1)} KB`,
      );

      console.log(`[9] top ${TOP_N} words (filtered):`);
      console.table(
        topWords(filtered, TOP_N).map(([word, count]) => ({ word, count })),
      );

      // --- prefix index ---
      const t6 = performance.now();
      const prefixIndex = buildPrefixIndex(filtered);
      const t7 = performance.now();
      const prefixSize = approximatePrefixIndexSizeBytes(prefixIndex);
      const listLens = [...prefixIndex.values()].map((l) => l.length);
      const maxListLen = listLens.length > 0 ? Math.max(...listLens) : 0;
      const avgListLen =
        listLens.length > 0
          ? listLens.reduce((a, b) => a + b, 0) / listLens.length
          : 0;
      console.log(
        `[10] build prefix index (2-char → words): ${(t7 - t6).toFixed(1)} ms\n` +
          `    prefixes    : ${prefixIndex.size.toLocaleString()}\n` +
          `    avg list len: ${avgListLen.toFixed(1)}\n` +
          `    max list len: ${maxListLen}\n` +
          `    index size  : ~${(prefixSize / 1024).toFixed(1)} KB`,
      );

      // --- lookup benchmark ---
      console.log(
        `[11] lookup benchmark (${LOOKUP_ITERATIONS} iterations per query):`,
      );
      const lookupResults = SAMPLE_QUERIES.map((query) => {
        const start = performance.now();
        const final =
          Array.from({ length: LOOKUP_ITERATIONS }, () =>
            lookupSuggestions(prefixIndex, filtered, query, SUGGEST_LIMIT),
          ).at(-1) ?? [];
        const elapsed = performance.now() - start;
        return {
          query,
          "avg μs/lookup": ((elapsed * 1000) / LOOKUP_ITERATIONS).toFixed(2),
          "result count": final.length,
          "top match": final[0] ? `${final[0][0]} (${final[0][1]})` : "—",
        };
      });
      console.table(lookupResults);

      console.groupEnd();
    } catch (e) {
      console.error("[DebugTools] analysis failed:", e);
    } finally {
      setRunning(false);
    }
  };

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
        インクリメンタルサジェスト実現可能性の計測。結果はブラウザの DevTools
        コンソールに出力されます。
      </p>
      <Button
        type='button'
        variant='secondary'
        onClick={handleAnalyze}
        disabled={running}
      >
        {running ? "Analyzing..." : "Analyze vocabulary (all bookmarks)"}
      </Button>
    </section>
  );
};
