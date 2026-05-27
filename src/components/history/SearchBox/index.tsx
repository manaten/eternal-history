import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";

import { t } from "../../../i18n";
import { requestSuggestions } from "../../../util/suggest";
import { SearchSuggestions } from "../SearchSuggestions";

const SUGGEST_LIMIT = 10;
const MIN_QUERY_LEN = 2;

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isLoading: boolean;
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
 * "github tok" + "tokyucorp" → "github tokyucorp "
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
}) => {
  // 「現在のトークンに紐づくサジェスト結果」を一塊で持つ。lastToken が変わると派生的に
  // suggestions が [] になり、新しい async 結果が届いたタイミングで更新される。
  // こうすると useEffect 内で setState を同期実行する必要がなく、不要なレンダーも防げる。
  const [data, setData] = useState<{
    token: string;
    suggestions: readonly string[];
  }>({ token: "", suggestions: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastToken = getLastToken(searchQuery);

  // 初期マウント時のみフォーカス。`ref={(e) => e?.focus()}` のように毎レンダーで
  // focus() を呼ぶと、想定外のタイミングで focus が動いて挙動が読みにくくなるため。
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // サジェスト取得トリガは「lastToken の変化」と「フォーカス取得」の 2 つ。
  // 後者を含めるのは、background 一時障害で空配列を掴んだまま固まるケースを
  // blur→refocus で復旧できるようにするため。
  useEffect(() => {
    if (!focused) return;
    if (lastToken.length < MIN_QUERY_LEN) return;
    const cancelled = { current: false };
    requestSuggestions(lastToken, SUGGEST_LIMIT)
      .then((results) => {
        if (cancelled.current) return;
        setData({ token: lastToken, suggestions: results });
        setSelectedIndex(-1);
      })
      .catch((e) => {
        // 一時障害時は state を更新せず、前回の有効結果を保持する。
        // 次の lastToken 変化 or refocus でリトライが走る。
        console.warn("suggest fetch failed:", e);
      });
    return () => {
      // eslint-disable-next-line functional/immutable-data
      cancelled.current = true;
    };
  }, [lastToken, focused]);

  const suggestions = data.token === lastToken ? data.suggestions : [];

  const applySuggestion = (suggestion: string) => {
    onSearchQueryChange(replaceLastToken(searchQuery, suggestion));
    setData({ token: "", suggestions: [] });
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (i) => (i - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[selectedIndex];
      if (suggestion) applySuggestion(suggestion);
    } else if (e.key === "Tab" && selectedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[selectedIndex];
      if (suggestion) applySuggestion(suggestion);
    } else if (e.key === "Escape") {
      setData({ token: "", suggestions: [] });
      setSelectedIndex(-1);
    }
  };

  const handleSaveQuery = () => {
    if (searchQuery.trim() && onSaveQuery) {
      onSaveQuery(searchQuery.trim());
    }
  };

  const dropdownVisible = focused && suggestions.length > 0;

  return (
    <div className='relative'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(searchQuery);
        }}
      >
        <input
          ref={inputRef}
          type='text'
          placeholder={t("searchBox.placeholder")}
          value={searchQuery}
          onChange={(e) => {
            onSearchQueryChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
          onHover={setSelectedIndex}
        />
      )}
    </div>
  );
};
