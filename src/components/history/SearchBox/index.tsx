import { FC, KeyboardEvent, useEffect, useReducer, useRef } from "react";

import { initialSearchBoxState, searchBoxReducer } from "./state";
import { t } from "../../../i18n";
import { SearchSuggestions } from "../SearchSuggestions";

const SUGGEST_LIMIT = 10;
const MIN_QUERY_LEN = 1;
/**
 * キーストロークごとに sendMessage を発火すると SW wake コストやメッセージング往復が
 * 連発するので、入力の "落ち着き" を待ってからフェッチする。短すぎると意味がなく、
 * 長すぎると体感応答性が落ちる。80ms 程度がだいたい体感ゼロ。
 */
const SUGGEST_DEBOUNCE_MS = 80;

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isLoading: boolean;
  /**
   * サジェスト候補を取得する副作用。本番では background SW へのメッセージング、
   * Storybook ではモック実装が渡される。SearchBox 自体は副作用ソースを知らない。
   */
  onRequestSuggestions: (
    query: string,
    limit: number,
  ) => Promise<readonly string[]>;
}

/**
 * クエリの末尾トークン (空白区切りで最後の単語) を返す。
 * 入力が空白で終わっている場合は「直前の単語は確定済み」とみなし空文字を返す。
 */
function getLastToken(query: string): string {
  if (query.length === 0 || /\s$/.test(query)) return "";
  const tokens = query.split(/\s+/);
  return tokens[tokens.length - 1] ?? "";
}

/**
 * クエリの末尾トークンを `replacement` に置換し、後ろに空白を 1 つ付けた文字列を返す。
 * "github man" + "manaten" → "github manaten "
 */
function replaceLastToken(query: string, replacement: string): string {
  const tokens = query.split(/\s+/);
  return [...tokens.slice(0, -1), replacement].join(" ") + " ";
}

export const SearchBox: FC<SearchBoxProps> = ({
  onSearch,
  onSaveQuery,
  searchQuery,
  onSearchQueryChange,
  isLoading,
  onRequestSuggestions,
}) => {
  const [state, dispatch] = useReducer(searchBoxReducer, initialSearchBoxState);
  const { data, selectedIndex, dismissed, composing } = state;
  const inputRef = useRef<HTMLInputElement>(null);

  const lastToken = getLastToken(searchQuery);
  // 表示は「前回 fetch の結果を、現在のトークンで startsWith 再フィルタしたもの」。
  // こうすると次のキーストロークで narrowing しながら、新しい fetch が返ってくるまで
  // 前回結果を破棄せずに表示し続けられる (キー押下のたびにドロップダウンが点滅しない)。
  // 前回と全く違う prefix に変わった場合は filter 結果が空になり自然にドロップダウンが消え、
  // fetch 完了時に新しい候補で再表示される。
  const lowerLastToken = lastToken.toLowerCase();
  const suggestions =
    lastToken.length < MIN_QUERY_LEN
      ? []
      : data.suggestions.filter((w) =>
          w.toLowerCase().startsWith(lowerLastToken),
        );
  const dropdownVisible = !dismissed && suggestions.length > 0;

  // isLoading が外れたタイミングで一度だけフォーカス。マウント時は input が disabled で
  // focus() が no-op になるので、disabled が解除された瞬間に拾う。
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  // サジェスト取得トリガは lastToken / dismissed / composing の変化。
  // dismissed が外れた瞬間 (focus or 入力再開) にも再フェッチが走るので、
  // background 一時障害で焼き付いた結果を blur→refocus で復旧できる。
  // composing 中はトリガしない (preedit で半端なフェッチが走るとドロップダウンが点滅する)。
  // 連続キー入力を吸収するため SUGGEST_DEBOUNCE_MS の遅延を入れる。
  useEffect(() => {
    if (dismissed) return;
    if (composing) return;
    if (lastToken.length < MIN_QUERY_LEN) return;
    const cancelled = { current: false };
    const timer = setTimeout(() => {
      onRequestSuggestions(lastToken, SUGGEST_LIMIT)
        .then((results) => {
          if (cancelled.current) return;
          dispatch({
            type: "suggestionsReceived",
            token: lastToken,
            suggestions: results,
          });
        })
        .catch((e) => {
          // 一時障害時は state を更新しない。前回の有効結果を保持する。
          console.warn("suggest fetch failed:", e);
        });
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      // eslint-disable-next-line functional/immutable-data
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [lastToken, dismissed, composing, onRequestSuggestions]);

  const applySuggestion = (suggestion: string) => {
    onSearchQueryChange(replaceLastToken(searchQuery, suggestion));
    dispatch({ type: "suggestionApplied" });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME composition 中のキーは IME 側に任せる。
    if (composing) return;
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({
        type: "navigated",
        direction: "down",
        total: suggestions.length,
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({
        type: "navigated",
        direction: "up",
        total: suggestions.length,
      });
    } else if ((e.key === "Enter" || e.key === "Tab") && selectedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[selectedIndex];
      if (suggestion) applySuggestion(suggestion);
    } else if (e.key === "Escape") {
      dispatch({ type: "escaped" });
    }
  };

  const handleSaveQuery = () => {
    if (searchQuery.trim() && onSaveQuery) {
      onSaveQuery(searchQuery.trim());
    }
  };

  return (
    <div className='relative'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: "submitted" });
          onSearch(searchQuery);
        }}
      >
        <input
          ref={inputRef}
          type='text'
          placeholder={t("searchBox.placeholder")}
          value={searchQuery}
          onChange={(e) => {
            dispatch({ type: "typed" });
            onSearchQueryChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => dispatch({ type: "compositionStarted" })}
          onCompositionEnd={() => dispatch({ type: "compositionEnded" })}
          onFocus={() => dispatch({ type: "focused" })}
          onBlur={() => dispatch({ type: "blurred" })}
          autoComplete='off'
          className={`
            w-full rounded-xl border-2 border-transparent bg-white p-4 pr-14
            pl-5 text-base font-normal text-gray-800 shadow-md outline-none
            placeholder:font-normal placeholder:text-gray-400
            focus:-translate-y-px focus:border-theme-base focus:shadow-md
            focus:ring-4 focus:ring-theme-base/10
            disabled:cursor-not-allowed disabled:bg-gray-100
            disabled:text-gray-400 disabled:shadow-sm
          `}
          disabled={isLoading}
        />
        <button
          type='button'
          onClick={handleSaveQuery}
          className={`
            absolute top-1/2 right-2 flex size-10 -translate-y-1/2
            cursor-pointer items-center justify-center rounded-lg border-none
            bg-theme-base text-xl font-semibold text-white shadow-sm
            transition-all duration-200
            hover:not-disabled:scale-105 hover:not-disabled:bg-theme-hover
            hover:not-disabled:shadow-md
            active:not-disabled:scale-95
            disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-100
            disabled:text-gray-400 disabled:shadow-sm
          `}
          disabled={isLoading || !searchQuery.trim()}
          title={t("searchBox.saveQuery")}
        >
          +
        </button>
      </form>
      {dropdownVisible && (
        <SearchSuggestions
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={applySuggestion}
          onHover={(i) => dispatch({ type: "hovered", index: i })}
        />
      )}
    </div>
  );
};
