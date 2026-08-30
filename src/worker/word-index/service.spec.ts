import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { PersistedWordIndex } from "./cache";
import { createWordIndexService } from "./service";
import { buildWordIndex } from "../../common/word-index";

function makeDeps(overrides?: {
  texts?: readonly string[];
  cached?: PersistedWordIndex | null;
}) {
  const getSourceTexts = vi
    .fn()
    .mockResolvedValue(overrides?.texts ?? ["GitHub GitHub", "GitLab"]);
  const loadCache = vi.fn().mockResolvedValue(overrides?.cached ?? null);
  const saveCache = vi.fn().mockResolvedValue(undefined);
  return { getSourceTexts, loadCache, saveCache };
}

function fresh(texts: string[]): PersistedWordIndex {
  return { index: buildWordIndex(texts), builtAt: Date.now() };
}

describe("createWordIndexService", () => {
  it("キャッシュミス時はフル再構築して suggest でき、builtAt 付きで save する", async () => {
    const deps = makeDeps();
    const service = createWordIndexService(deps);

    const before = Date.now();
    expect(await service.suggest("git", 10)).toEqual(["GitHub", "GitLab"]);
    expect(deps.getSourceTexts).toHaveBeenCalledOnce();
    expect(deps.saveCache).toHaveBeenCalledOnce();
    const [, savedBuiltAt] = deps.saveCache.mock.calls[0]!;
    expect(savedBuiltAt).toBeGreaterThanOrEqual(before);
  });

  it("新しいキャッシュにヒットしたらビルドせずキャッシュから suggest する", async () => {
    const deps = makeDeps({ cached: fresh(["Cached Title"]) });
    const service = createWordIndexService(deps);

    expect(await service.suggest("cach", 10)).toEqual(["Cached"]);
    expect(deps.getSourceTexts).not.toHaveBeenCalled();
  });

  it("キャッシュ load 失敗はフル再構築にフォールバックする", async () => {
    const deps = makeDeps();
    deps.loadCache.mockRejectedValue(new Error("storage broken"));
    const service = createWordIndexService(deps);

    expect(await service.suggest("git", 10)).toEqual(["GitHub", "GitLab"]);
  });

  it("save 失敗でも suggest は成功する (warn のみ)", async () => {
    const deps = makeDeps();
    deps.saveCache.mockRejectedValue(new Error("quota exceeded"));
    const service = createWordIndexService(deps);

    expect(await service.suggest("git", 10)).toEqual(["GitHub", "GitLab"]);
  });

  it("並行 suggest でもビルドは 1 回に集約される", async () => {
    const deps = makeDeps();
    const service = createWordIndexService(deps);

    const [a, b] = await Promise.all([
      service.suggest("git", 10),
      service.suggest("git", 10),
    ]);

    expect(a).toEqual(["GitHub", "GitLab"]);
    expect(b).toEqual(["GitHub", "GitLab"]);
    expect(deps.getSourceTexts).toHaveBeenCalledOnce();
  });

  it("rebuild はキャッシュを読まずにフル再構築し save する", async () => {
    const deps = makeDeps({ cached: fresh(["Cached Title"]) });
    const service = createWordIndexService(deps);

    const built = await service.rebuild();

    expect(deps.loadCache).not.toHaveBeenCalled();
    expect(built.wordCounts.get("GitHub")).toBe(2);
    expect(deps.saveCache).toHaveBeenCalledWith(built, expect.any(Number));
  });

  it("notifyStale: index 未構築・キャッシュ無しなら初回ビルドが走る", async () => {
    const deps = makeDeps();
    const service = createWordIndexService(deps);

    service.notifyStale();

    // 初回は loadCache を挟むため非同期。getSourceTexts が呼ばれるまで待つ。
    await vi.waitFor(() => expect(deps.getSourceTexts).toHaveBeenCalledOnce());
  });

  it("ビルド失敗後も次回 suggest で再試行できる (inFlightBuild がクリアされる)", async () => {
    const deps = makeDeps();
    deps.getSourceTexts
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue(["GitHub GitHub", "GitLab"]);
    const service = createWordIndexService(deps);

    await expect(service.suggest("git", 10)).rejects.toThrow("transient");
    // 進行中ビルドがクリアされ、2 回目は再試行して成功する。
    expect(await service.suggest("git", 10)).toEqual(["GitHub", "GitLab"]);
    expect(deps.getSourceTexts).toHaveBeenCalledTimes(2);
  });

  function staleCache(texts: string[]): PersistedWordIndex {
    // builtAt を 31 分前にして stale 判定させる (STALE_AFTER_MS = 30 分)。
    return {
      index: buildWordIndex(texts),
      builtAt: Date.now() - 31 * 60 * 1000,
    };
  }

  it("stale なキャッシュはロード値を即返ししつつ背後で 1 回再構築する (cold start)", async () => {
    const deps = makeDeps({ cached: staleCache(["Cached Cached"]) });
    const service = createWordIndexService(deps);

    // 再構築を待たずキャッシュ由来の値を即返しする。
    expect(await service.suggest("cach", 10)).toEqual(["Cached"]);
    // stale なので背後で 1 回だけ再構築が起動する。
    await vi.waitFor(() => expect(deps.getSourceTexts).toHaveBeenCalledOnce());
  });

  it("stale 時は待たずに古い値を返し、再構築完了後は新しいソース由来に切り替わる", async () => {
    const deps = makeDeps({
      cached: staleCache(["Old Old"]),
      texts: ["New New", "Next"],
    });
    const service = createWordIndexService(deps);

    // 即返しは古い (キャッシュの) index。
    expect(await service.suggest("o", 10)).toEqual(["Old"]);
    // 背後の再構築が保存まで完了するのを待つ。
    await vi.waitFor(() => expect(deps.saveCache).toHaveBeenCalledOnce());
    // 以後はソース由来の新しい index を返す。
    expect(await service.suggest("n", 10)).toEqual(["New", "Next"]);
    expect(deps.getSourceTexts).toHaveBeenCalledOnce();
  });

  it("stale 再構築が失敗しても古い index で suggest し続ける (graceful degradation)", async () => {
    const deps = makeDeps({ cached: staleCache(["Cached Cached"]) });
    deps.getSourceTexts.mockRejectedValue(new Error("rebuild boom"));
    const service = createWordIndexService(deps);

    // 即返しはキャッシュ。背後の再構築は失敗するが握りつぶす。
    expect(await service.suggest("cach", 10)).toEqual(["Cached"]);
    await vi.waitFor(() => expect(deps.getSourceTexts).toHaveBeenCalled());
    // 失敗後も古い index が残り、suggest は成功し続ける。
    expect(await service.suggest("cach", 10)).toEqual(["Cached"]);
  });

  describe("stale-while-revalidate (builtAt ベースの鮮度管理)", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("新しいうちは再構築しない (builtAt がスロットルになる)", async () => {
      const deps = makeDeps();
      const service = createWordIndexService(deps);
      await service.suggest("git", 10); // 初回ビルド

      vi.advanceTimersByTime(29 * 60 * 1000);
      await service.suggest("git", 10);

      expect(deps.getSourceTexts).toHaveBeenCalledOnce();
    });

    it("30 分を超えたら即返ししつつ裏で 1 回再構築する", async () => {
      const deps = makeDeps();
      const service = createWordIndexService(deps);
      await service.suggest("git", 10); // 初回ビルド

      vi.advanceTimersByTime(31 * 60 * 1000);
      // index は既にあるので suggest は同期パスで stale を即返ししつつ再構築を起動。
      // 再構築の getSourceTexts は同期的に呼ばれる。
      await service.suggest("git", 10);

      expect(deps.getSourceTexts).toHaveBeenCalledTimes(2);
    });

    it("notifyStale: 新しければ何もせず、古ければ再構築する", async () => {
      const deps = makeDeps();
      const service = createWordIndexService(deps);
      await service.suggest("git", 10);

      service.notifyStale();
      expect(deps.getSourceTexts).toHaveBeenCalledOnce(); // 新しいので何もしない

      vi.advanceTimersByTime(31 * 60 * 1000);
      service.notifyStale();
      expect(deps.getSourceTexts).toHaveBeenCalledTimes(2);
    });
  });
});
