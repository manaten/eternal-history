const enabled = import.meta.env.DEV;

export interface PerfReport {
  span<T>(name: string, fn: () => Promise<T> | T): Promise<T>;
  count(name: string, n?: number): void;
  log(extra?: Record<string, unknown>): void;
}

const noop: PerfReport = {
  async span(_name, fn) {
    return fn();
  },
  count() {},
  log() {},
};

/**
 * dev ビルド時のみ計測を有効化する簡易プロファイラ。
 * span で囲んだ処理の所要時間と count で記録した件数を蓄積し、
 * log() で 1 行のサマリとして出力します。
 */
export function perfReport(label: string): PerfReport {
  if (!enabled) {
    return noop;
  }

  const start = performance.now();
  const spans: Record<string, number> = {};
  const counts: Record<string, number> = {};

  return {
    async span(name, fn) {
      const s = performance.now();
      try {
        return await fn();
      } finally {
        // eslint-disable-next-line functional/immutable-data
        spans[name] = (spans[name] ?? 0) + (performance.now() - s);
      }
    },
    count(name, n = 1) {
      // eslint-disable-next-line functional/immutable-data
      counts[name] = (counts[name] ?? 0) + n;
    },
    log(extra) {
      const total = performance.now() - start;
      const breakdown = Object.fromEntries(
        Object.entries(spans).map(([k, v]) => [k, +v.toFixed(1)]),
      );
      console.log(`[perf] ${label} total=${total.toFixed(1)}ms`, {
        breakdown,
        counts,
        ...(extra ?? {}),
      });
    },
  };
}
