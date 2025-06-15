import { FC, useState } from "react";

import styles from "./SearchBox.module.css";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox: FC<SearchBoxProps> = ({ onSearch, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={styles.searchBox}>
      <input
        ref={(e) => e?.focus()}
        type='text'
        placeholder='Search history...'
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
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
