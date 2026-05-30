import { describe, it, expect } from "vitest";

import {
  initialSearchBoxState,
  searchBoxReducer,
  SearchBoxState,
} from "./state";

const baseState = initialSearchBoxState;

describe("searchBoxReducer", () => {
  it("初期状態は dismissed=true (ユーザーが何かするまでドロップダウンを出さない)", () => {
    expect(initialSearchBoxState.dismissed).toBe(true);
  });

  describe("typed", () => {
    it("dismissed を解除する (非 composition 時)", () => {
      const state: SearchBoxState = { ...baseState, dismissed: true };
      const next = searchBoxReducer(state, { type: "typed" });
      expect(next.dismissed).toBe(false);
    });

    it("composition 中は dismissed を維持する (Escape の意図を保つ)", () => {
      const state: SearchBoxState = {
        ...baseState,
        dismissed: true,
        composing: true,
      };
      const next = searchBoxReducer(state, { type: "typed" });
      expect(next.dismissed).toBe(true);
    });
  });

  it("focused は dismissed=false にする (refocus でドロップダウン復帰)", () => {
    const state: SearchBoxState = { ...baseState, dismissed: true };
    const next = searchBoxReducer(state, { type: "focused" });
    expect(next.dismissed).toBe(false);
  });

  it("blurred は dismissed=true にする", () => {
    const state: SearchBoxState = { ...baseState, dismissed: false };
    const next = searchBoxReducer(state, { type: "blurred" });
    expect(next.dismissed).toBe(true);
  });

  it("escaped は dismissed=true & selectedIndex=-1 にする", () => {
    const state: SearchBoxState = {
      ...baseState,
      dismissed: false,
      selectedIndex: 3,
    };
    const next = searchBoxReducer(state, { type: "escaped" });
    expect(next.dismissed).toBe(true);
    expect(next.selectedIndex).toBe(-1);
  });

  it("submitted は dismissed=true にする", () => {
    const state: SearchBoxState = { ...baseState, dismissed: false };
    const next = searchBoxReducer(state, { type: "submitted" });
    expect(next.dismissed).toBe(true);
  });

  describe("navigated", () => {
    it("down で次へ進む", () => {
      const state: SearchBoxState = { ...baseState, selectedIndex: 0 };
      const next = searchBoxReducer(state, {
        type: "navigated",
        direction: "down",
        total: 3,
      });
      expect(next.selectedIndex).toBe(1);
    });

    it("末尾の down で先頭に戻る (循環)", () => {
      const state: SearchBoxState = { ...baseState, selectedIndex: 2 };
      const next = searchBoxReducer(state, {
        type: "navigated",
        direction: "down",
        total: 3,
      });
      expect(next.selectedIndex).toBe(0);
    });

    it("未選択 (-1) からの up で末尾を選択", () => {
      const next = searchBoxReducer(baseState, {
        type: "navigated",
        direction: "up",
        total: 3,
      });
      expect(next.selectedIndex).toBe(2);
    });

    it("total=0 のときは state を変えない", () => {
      const state: SearchBoxState = { ...baseState, selectedIndex: 5 };
      const next = searchBoxReducer(state, {
        type: "navigated",
        direction: "down",
        total: 0,
      });
      expect(next).toBe(state);
    });
  });

  it("hovered は selectedIndex を指定値に設定する", () => {
    const next = searchBoxReducer(baseState, { type: "hovered", index: 2 });
    expect(next.selectedIndex).toBe(2);
  });

  it("suggestionApplied は data と selectedIndex をクリアする", () => {
    const state: SearchBoxState = {
      ...baseState,
      data: { token: "git", suggestions: ["GitHub"] },
      selectedIndex: 0,
    };
    const next = searchBoxReducer(state, { type: "suggestionApplied" });
    expect(next.data).toEqual({ token: "", suggestions: [] });
    expect(next.selectedIndex).toBe(-1);
  });

  it("suggestionsReceived は data を更新し selectedIndex をリセットする", () => {
    const state: SearchBoxState = { ...baseState, selectedIndex: 2 };
    const next = searchBoxReducer(state, {
      type: "suggestionsReceived",
      token: "git",
      suggestions: ["GitHub", "GitLab"],
    });
    expect(next.data).toEqual({
      token: "git",
      suggestions: ["GitHub", "GitLab"],
    });
    expect(next.selectedIndex).toBe(-1);
  });

  describe("composition", () => {
    it("compositionStarted で composing=true", () => {
      const next = searchBoxReducer(baseState, {
        type: "compositionStarted",
      });
      expect(next.composing).toBe(true);
    });

    it("compositionEnded で composing=false", () => {
      const state: SearchBoxState = { ...baseState, composing: true };
      const next = searchBoxReducer(state, { type: "compositionEnded" });
      expect(next.composing).toBe(false);
    });
  });
});
