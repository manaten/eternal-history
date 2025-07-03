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
    <div className='m-0 relative'>
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
          className='w-full py-4 pr-14 pl-5 text-base font-normal text-gray-800 bg-white border-2 border-transparent rounded-xl shadow-md outline-none placeholder:text-gray-400 placeholder:font-normal focus:border-primary focus:shadow-md focus:ring-4 focus:ring-primary/10 focus:-translate-y-px disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-sm md:py-3.5 md:px-4'
          disabled={isLoading}
        />
        <button
          type='button'
          onClick={handleSaveQuery}
          className='absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 border-none rounded-lg bg-primary text-white text-xl font-semibold cursor-pointer flex items-center justify-center transition-all duration-200 shadow-sm hover:not-disabled:bg-primary-hover hover:not-disabled:scale-105 hover:not-disabled:shadow-md active:not-disabled:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-sm'
          disabled={isLoading || !searchQuery.trim()}
          title={t("searchBox.saveQuery")}
        >
          +
        </button>
      </form>
    </div>
  );
};
