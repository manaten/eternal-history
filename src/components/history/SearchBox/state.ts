/**
 * SearchBox の局所状態機械。
 *
 * 状態の最小化方針:
 *   - 「ドロップダウンを出さない理由」(blur / Escape / submit / 初期) は一つの
 *     `dismissed` フラグに集約。フォーカスを得る・文字を打つ・composition が
 *     終わる等で dismiss を解除する。
 *   - 旧 `focused` state は dropdown 表示と useEffect 再フェッチに使っていたが、
 *     どちらも「dismissed でない」と等価に扱えるので状態を 1 つ減らした。
 *
 * 不変条件:
 *   - サジェスト結果は「最後に受信したトークン」とセットで保持する。表示時に
 *     現在の lastToken と一致するかチェックし、不一致なら空配列として扱う。
 *   - IME composition 中の typed (preedit イベント) では dismissed を維持する
 *     (Escape の意図を保つため)。
 */

export interface SearchBoxState {
  /** 最後に取得したサジェスト結果と、それが何のトークンに対するものか。 */
  data: { token: string; suggestions: readonly string[] };
  /** ドロップダウンで選択中のインデックス。未選択は -1。 */
  selectedIndex: number;
  /**
   * ドロップダウンを出さない状態。
   * - 初期、blur、Escape、submit でセット
   * - typed (非 composing)、focused、compositionEnded、suggestionApplied でクリア
   *
   * ドロップダウン表示の最終判断は呼び出し側で
   * `!dismissed && suggestions.length > 0` として derive する。
   */
  dismissed: boolean;
  /** IME composition (未確定入力) 中フラグ。 */
  composing: boolean;
}

export type SearchBoxAction =
  | { type: "typed" }
  | { type: "focused" }
  | { type: "blurred" }
  | { type: "escaped" }
  | { type: "submitted" }
  | { type: "compositionStarted" }
  | { type: "compositionEnded" }
  | { type: "navigated"; direction: "up" | "down"; total: number }
  | { type: "hovered"; index: number }
  | { type: "suggestionApplied" }
  | {
      type: "suggestionsReceived";
      token: string;
      suggestions: readonly string[];
    };

export const initialSearchBoxState: SearchBoxState = {
  data: { token: "", suggestions: [] },
  selectedIndex: -1,
  // 初期はドロップダウンを出さない。マウント直後 (ユーザーが何もしてない状態) で
  // 出るのを防ぐため。typed / focused で解除される。
  dismissed: true,
  composing: false,
};

export function searchBoxReducer(
  state: SearchBoxState,
  action: SearchBoxAction,
): SearchBoxState {
  switch (action.type) {
    case "typed":
      // composition 中の preedit 入力では Escape 状態を解除しない。
      return state.composing ? state : { ...state, dismissed: false };
    case "focused":
      return { ...state, dismissed: false };
    case "blurred":
      return { ...state, dismissed: true };
    case "escaped":
      return { ...state, dismissed: true, selectedIndex: -1 };
    case "submitted":
      return { ...state, dismissed: true };
    case "compositionStarted":
      return { ...state, composing: true };
    case "compositionEnded":
      return { ...state, composing: false };
    case "navigated": {
      if (action.total === 0) return state;
      // 未選択 (-1) の場合: down で先頭、up で末尾。それ以外は通常の循環。
      const cur =
        state.selectedIndex < 0
          ? action.direction === "down"
            ? -1
            : action.total
          : state.selectedIndex;
      const next =
        action.direction === "down"
          ? (cur + 1) % action.total
          : (cur - 1 + action.total) % action.total;
      return { ...state, selectedIndex: next };
    }
    case "hovered":
      return { ...state, selectedIndex: action.index };
    case "suggestionApplied":
      // 適用後はサジェスト一覧を空にして閉じる。次の入力で再フェッチされる。
      return {
        ...state,
        data: { token: "", suggestions: [] },
        selectedIndex: -1,
      };
    case "suggestionsReceived":
      return {
        ...state,
        data: { token: action.token, suggestions: action.suggestions },
        selectedIndex: -1,
      };
  }
}
