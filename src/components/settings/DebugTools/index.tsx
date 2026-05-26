import { FC, useState } from "react";

import {
  bookmarkHistoryStore,
  convertBookmarksForDebug,
  getAllRawBookmarksForDebug,
} from "../../../infra/bookmark-history-store";
import {
  analyzeTexts,
  approximateMapSizeBytes,
  bucketByCount,
  bucketByLength,
  topWords,
} from "../../../util/wordAnalysis";
import { Button } from "../../common/Button";

const COUNT_THRESHOLDS = [1, 2, 5, 10, 30, 100];
const TOP_N = 30;

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

      console.log(`[7] top ${TOP_N} words:`);
      console.table(
        topWords(result.wordCounts, TOP_N).map(([word, count]) => ({
          word,
          count,
        })),
      );

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
