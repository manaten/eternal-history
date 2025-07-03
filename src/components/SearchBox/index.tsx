import { FC } from "react";

import { t } from "../../i18n";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox: FC<SearchBoxProps> = ({
  onSearch,
  onSaveQuery,
  searchQuery,
  onSearchQueryChange,
  isLoading,
}) => {
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
          onSearch(searchQuery);
        }}
      >
        <input
          ref={(e) => e?.focus()}
          type='text'
          placeholder={t("searchBox.placeholder")}
          value={searchQuery}
          onChange={(e) => {
            onSearchQueryChange(e.target.value);
          }}
          className={`
            w-full rounded-xl border-2 border-transparent bg-white p-4 pr-14
            pl-5 text-base font-normal text-gray-800 shadow-md outline-none
            placeholder:font-normal placeholder:text-gray-400
            focus:-translate-y-px focus:border-primary focus:shadow-md
            focus:ring-4 focus:ring-primary/10
            disabled:cursor-not-allowed disabled:bg-gray-100
            disabled:text-gray-400 disabled:shadow-sm
          `}
          disabled={isLoading}
        />
        <button
          type='button'
          onClick={handleSaveQuery}
          className={`
            absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2
            cursor-pointer items-center justify-center rounded-lg border-none
            bg-primary text-xl font-semibold text-white shadow-sm transition-all
            duration-200
            hover:not-disabled:scale-105 hover:not-disabled:bg-primary-hover
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
    </div>
  );
};
