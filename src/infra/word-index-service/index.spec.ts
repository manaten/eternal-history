import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { buildWordIndex } from "../../domain/word-index";
import { PersistedWordIndex } from "../word-index-cache";
import { createWordIndexService } from "./index";

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
