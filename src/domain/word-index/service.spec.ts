import { describe, it, expect, vi } from "vitest";

import { buildWordIndex, PersistedWordIndex } from "./index";
import { createWordIndexService } from "./service";
import { WordIndex } from "./types";

function makeDeps(overrides?: {
  texts?: readonly string[];
  cached?: PersistedWordIndex | null;
}) {
  const getSourceTexts = vi
    .fn()
    .mockResolvedValue(overrides?.texts ?? ["GitHub GitHub", "GitLab"]);
  const load = vi.fn().mockResolvedValue(overrides?.cached ?? null);
  const save = vi.fn().mockResolvedValue(undefined);
  return { getSourceTexts, cache: { load, save } };
}

function freshCache(index: WordIndex): PersistedWordIndex {
  return { index, builtAt: Date.now() };
}

describe("createWordIndexService (cache 連携)", () => {
  it("新しいキャッシュにヒットしたらビルドせずキャッシュを返す", async () => {
    const cached = freshCache(buildWordIndex(["Cached Title"]));
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    const index = await service.getIndex();

    expect(index).toBe(cached.index);
    expect(deps.getSourceTexts).not.toHaveBeenCalled();
    expect(await service.suggest("cach", 10)).toEqual(["Cached"]);
  });

  it("古いキャッシュは即返しつつ、裏でフル再構築して save する (stale-while-revalidate)", async () => {
    const staleBuiltAt = Date.now() - 31 * 60 * 1000; // throttle (30 分) より古い
    const cached = {
      index: buildWordIndex(["Cached Title"]),
      builtAt: staleBuiltAt,
    };
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    // 初回はキャッシュを即返す (再構築を待たない)
    const index = await service.getIndex();
    expect(index).toBe(cached.index);

    // 裏の再構築が完了すると latestIndex が新しい index に置き換わる
    await vi.waitFor(() =>
      expect(deps.cache.save).toHaveBeenCalledWith(
        expect.objectContaining({
          wordCounts: expect.any(Map),
        }),
        expect.any(Number),
      ),
    );
    await vi.waitFor(async () =>
      expect((await service.getIndex()).wordCounts.get("GitHub")).toBe(2),
    );
    expect(deps.getSourceTexts).toHaveBeenCalledOnce();
  });

  it("キャッシュミス時はフル再構築して builtAt 付きで save する", async () => {
    const deps = makeDeps();
    const service = createWordIndexService(deps);

    const before = Date.now();
    const index = await service.getIndex();

    expect(deps.getSourceTexts).toHaveBeenCalledOnce();
    expect(index.wordCounts.get("GitHub")).toBe(2);
    await vi.waitFor(() => expect(deps.cache.save).toHaveBeenCalledOnce());
    const [savedIndex, savedBuiltAt] = deps.cache.save.mock.calls[0]!;
    expect(savedIndex).toBe(index);
    expect(savedBuiltAt).toBeGreaterThanOrEqual(before);
  });

  it("キャッシュ load 失敗はフル再構築にフォールバックする", async () => {
    const deps = makeDeps();
    deps.cache.load.mockRejectedValue(new Error("storage broken"));
    const service = createWordIndexService(deps);

    const index = await service.getIndex();

    expect(index.wordCounts.get("GitHub")).toBe(2);
  });

  it("並行 getIndex でキャッシュ load は 1 回に集約される", async () => {
    const cached = freshCache(buildWordIndex(["Cached Title"]));
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    const [a, b] = await Promise.all([service.getIndex(), service.getIndex()]);

    expect(a).toBe(cached.index);
    expect(b).toBe(cached.index);
    expect(deps.cache.load).toHaveBeenCalledOnce();
  });

  it("rebuild はキャッシュを読まずにフル再構築し save する", async () => {
    const cached = freshCache(buildWordIndex(["Cached Title"]));
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    const index = await service.rebuild();

    expect(deps.cache.load).not.toHaveBeenCalled();
    expect(index.wordCounts.get("GitHub")).toBe(2);
    await vi.waitFor(() =>
      expect(deps.cache.save).toHaveBeenCalledWith(index, expect.any(Number)),
    );
  });

  it("キャッシュ load 中に rebuild が完了した場合は新しい index を優先する", async () => {
    const cached = freshCache(buildWordIndex(["Cached Title"]));
    const deps = makeDeps({ cached });
    // load を遅延させ、その間に rebuild を完了させる
    // eslint-disable-next-line functional/no-let
    let resolveLoad!: (cache: PersistedWordIndex) => void;
    deps.cache.load.mockReturnValue(
      new Promise<PersistedWordIndex>((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const service = createWordIndexService(deps);

    const getIndexPromise = service.getIndex();
    const rebuilt = await service.rebuild();
    resolveLoad(cached);

    expect(await getIndexPromise).toBe(rebuilt);
  });

  it("キャッシュ load 中に開始された rebuild が未完了なら、その完了を待って合流する", async () => {
    const cached = freshCache(buildWordIndex(["Cached Title"]));
    const deps = makeDeps({ cached });
    // load と build の両方を手動で resolve できるようにする
    // eslint-disable-next-line functional/no-let
    let resolveLoad!: (cache: PersistedWordIndex) => void;
    deps.cache.load.mockReturnValue(
      new Promise<PersistedWordIndex>((resolve) => {
        resolveLoad = resolve;
      }),
    );
    // eslint-disable-next-line functional/no-let
    let resolveTexts!: (texts: readonly string[]) => void;
    deps.getSourceTexts.mockReturnValue(
      new Promise<readonly string[]>((resolve) => {
        resolveTexts = resolve;
      }),
    );
    const service = createWordIndexService(deps);

    const getIndexPromise = service.getIndex(); // load 待ちに入る
    const rebuildPromise = service.rebuild(); // build 開始 (texts 待ちで未完了)
    resolveLoad(cached); // load 解決時点で inFlightBuild が居る
    resolveTexts(["Rebuilt Title"]);

    const [fromGetIndex, fromRebuild] = await Promise.all([
      getIndexPromise,
      rebuildPromise,
    ]);
    expect(fromGetIndex).toBe(fromRebuild);
    expect(fromGetIndex.wordCounts.has("Rebuilt")).toBe(true);
  });

  it("save 失敗でも getIndex は成功する (warn のみ)", async () => {
    const deps = makeDeps();
    deps.cache.save.mockRejectedValue(new Error("quota exceeded"));
    const service = createWordIndexService(deps);

    const index = await service.getIndex();

    expect(index.wordCounts.get("GitHub")).toBe(2);
  });

  it("cache 未指定でも従来どおり動作する", async () => {
    const getSourceTexts = vi.fn().mockResolvedValue(["GitHub"]);
    const service = createWordIndexService({ getSourceTexts });

    const index = await service.getIndex();

    expect(index.wordCounts.get("GitHub")).toBe(1);
  });

  describe("builtAt ベースの鮮度管理 (タイマーレス)", () => {
    it("メモリ上の index が古くなったら getIndex が即返ししつつ裏で再構築する", async () => {
      vi.useFakeTimers();
      try {
        const deps = makeDeps();
        const service = createWordIndexService(deps);
        await service.getIndex(); // 初回フルビルド (キャッシュ無し)
        expect(deps.getSourceTexts).toHaveBeenCalledOnce();

        // 30 分経過前は何もしない
        vi.advanceTimersByTime(29 * 60 * 1000);
        await service.getIndex();
        expect(deps.getSourceTexts).toHaveBeenCalledOnce();

        // 30 分経過後は裏で再構築が走る
        vi.advanceTimersByTime(2 * 60 * 1000);
        await service.getIndex();
        expect(deps.getSourceTexts).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it("rebuildIfStale: index が新しければ何もしない (builtAt がスロットルになる)", async () => {
      const deps = makeDeps();
      const service = createWordIndexService(deps);
      await service.getIndex(); // 初回ビルドで builtAt が新しい

      service.rebuildIfStale();
      service.rebuildIfStale();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(deps.getSourceTexts).toHaveBeenCalledOnce();
    });

    it("rebuildIfStale: builtAt が古ければ再構築する", async () => {
      vi.useFakeTimers();
      try {
        const deps = makeDeps();
        const service = createWordIndexService(deps);
        await service.getIndex();
        vi.advanceTimersByTime(31 * 60 * 1000);

        service.rebuildIfStale();

        expect(deps.getSourceTexts).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it("rebuildIfStale: index 未構築・キャッシュ無しなら初回ビルドが走る", async () => {
      const deps = makeDeps();
      const service = createWordIndexService(deps);

      service.rebuildIfStale();

      await vi.waitFor(() =>
        expect(deps.getSourceTexts).toHaveBeenCalledOnce(),
      );
      expect((await service.getIndex()).wordCounts.get("GitHub")).toBe(2);
    });

    it("rebuildIfStale: ビルド進行中は pending に集約し完了後にもう一度ビルドする", async () => {
      const deps = makeDeps();
      const resolvers: ((texts: readonly string[]) => void)[] = [];
      deps.getSourceTexts.mockImplementation(
        () =>
          new Promise<readonly string[]>((resolve) => {
            // eslint-disable-next-line functional/immutable-data
            resolvers.push(resolve);
          }),
      );
      const service = createWordIndexService(deps);

      const buildPromise = service.rebuild(); // 1 回目のビルド開始 (texts 待ち)
      service.rebuildIfStale(); // ビルド中の更新 → pending に集約
      resolvers[0]!(["First Title"]);
      await vi.waitFor(() => expect(resolvers.length).toBe(2)); // 完了後に 2 回目
      resolvers[1]!(["Second Title"]);

      const index = await buildPromise;
      expect(index.wordCounts.has("Second")).toBe(true);
    });

    it("古いキャッシュへの並行 getIndex でも再構築は 1 回に集約される", async () => {
      const cached = {
        index: buildWordIndex(["Cached Title"]),
        builtAt: Date.now() - 31 * 60 * 1000,
      };
      const deps = makeDeps({ cached });
      const service = createWordIndexService(deps);

      const results = await Promise.all([
        service.getIndex(),
        service.getIndex(),
        service.getIndex(),
      ]);

      expect(results.every((r) => r === cached.index)).toBe(true);
      await vi.waitFor(() => expect(deps.cache.save).toHaveBeenCalledOnce());
      expect(deps.getSourceTexts).toHaveBeenCalledOnce();
    });
  });
});
