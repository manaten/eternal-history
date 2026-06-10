import classNames from "classnames";
import { FC } from "react";

interface SearchSuggestionsProps {
  suggestions: readonly string[];
  selectedIndex: number;
  onSelect: (suggestion: string) => void;
  onHover: (index: number) => void;
}

export const SearchSuggestions: FC<SearchSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <ul
      className={`
        absolute inset-x-0 top-full z-10 mt-1 max-h-80 overflow-y-auto
        rounded-xl border border-gray-200 bg-white shadow-lg
      `}
      role='listbox'
    >
      {suggestions.map((suggestion, i) => (
        <li
          key={suggestion}
          role='option'
          aria-selected={i === selectedIndex}
          onMouseDown={(e) => {
            // blur で dropdown が閉じる前に onClick を発火させる
            e.preventDefault();
            onSelect(suggestion);
          }}
          onMouseEnter={() => onHover(i)}
          className={classNames(
            "cursor-pointer px-4 py-2 text-sm text-gray-800",
            i === selectedIndex && "bg-theme-base/10",
          )}
        >
          {suggestion}
        </li>
      ))}
    </ul>
  );
};
