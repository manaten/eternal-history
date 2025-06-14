import { FC } from "react";

import styles from "./SearchBox.module.css";

interface SearchBoxProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox: FC<SearchBoxProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isLoading,
}) => {
  return (
    <div className={styles.searchBox}>
      <input
        ref={(e) => e?.focus()}
        type='text'
        placeholder='Search history...'
        value={searchQuery}
        onChange={(e) => {
          onSearchQueryChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch(searchQuery);
          }
        }}
        className={styles.searchInput}
        disabled={isLoading}
      />
    </div>
  );
};
