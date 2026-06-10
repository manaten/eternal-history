import { describe, it, expect, vi } from "vitest";

import { buildWordIndex } from "./index";
import { createWordIndexService } from "./service";
import { WordIndex } from "./types";

function makeDeps(overrides?: {
  texts?: readonly string[];
  cached?: WordIndex | null;
}) {
  const getSourceTexts = vi
    .fn()
    .mockResolvedValue(overrides?.texts ?? ["GitHub GitHub", "GitLab"]);
  const load = vi.fn().mockResolvedValue(overrides?.cached ?? null);
  const save = vi.fn().mockResolvedValue(undefined);
  return { getSourceTexts, cache: { load, save } };
}

describe("createWordIndexService (cache 連携)", () => {
  it("キャッシュヒット時はビルドせずキャッシュを返す", async () => {
    const cached = buildWordIndex(["Cached Title"]);
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    const index = await service.getIndex();

    expect(index).toBe(cached);
    expect(deps.getSourceTexts).not.toHaveBeenCalled();
    expect(await service.suggest("cach", 10)).toEqual(["Cached"]);
  });

  it("キャッシュミス時はフル再構築して save する", async () => {
    const deps = makeDeps();
    const service = createWordIndexService(deps);

    const index = await service.getIndex();

    expect(deps.getSourceTexts).toHaveBeenCalledOnce();
    expect(index.wordCounts.get("GitHub")).toBe(2);
    await vi.waitFor(() => expect(deps.cache.save).toHaveBeenCalledOnce());
    expect(deps.cache.save).toHaveBeenCalledWith(index);
  });

  it("キャッシュ load 失敗はフル再構築にフォールバックする", async () => {
    const deps = makeDeps();
    deps.cache.load.mockRejectedValue(new Error("storage broken"));
    const service = createWordIndexService(deps);

    const index = await service.getIndex();

    expect(index.wordCounts.get("GitHub")).toBe(2);
  });

  it("並行 getIndex でキャッシュ load は 1 回に集約される", async () => {
    const cached = buildWordIndex(["Cached Title"]);
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    const [a, b] = await Promise.all([service.getIndex(), service.getIndex()]);

    expect(a).toBe(cached);
    expect(b).toBe(cached);
    expect(deps.cache.load).toHaveBeenCalledOnce();
  });

  it("rebuild はキャッシュを読まずにフル再構築し save する", async () => {
    const cached = buildWordIndex(["Cached Title"]);
    const deps = makeDeps({ cached });
    const service = createWordIndexService(deps);

    const index = await service.rebuild();

    expect(deps.cache.load).not.toHaveBeenCalled();
    expect(index.wordCounts.get("GitHub")).toBe(2);
    await vi.waitFor(() => expect(deps.cache.save).toHaveBeenCalledWith(index));
  });

  it("キャッシュ load 中に rebuild が完了した場合は新しい index を優先する", async () => {
    const cached = buildWordIndex(["Cached Title"]);
    const deps = makeDeps({ cached });
    // load を遅延させ、その間に rebuild を完了させる
    // eslint-disable-next-line functional/no-let
    let resolveLoad!: (index: WordIndex) => void;
    deps.cache.load.mockReturnValue(
      new Promise<WordIndex>((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const service = createWordIndexService(deps);

    const getIndexPromise = service.getIndex();
    const rebuilt = await service.rebuild();
    resolveLoad(cached);

    expect(await getIndexPromise).toBe(rebuilt);
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
});
