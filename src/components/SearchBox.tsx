import { FC, useState } from "react";

import styles from "./SearchBox.module.css";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  isLoading: boolean;
}

export const SearchBox: FC<SearchBoxProps> = ({
  onSearch,
  onSaveQuery,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSaveQuery = () => {
    if (searchQuery.trim() && onSaveQuery) {
      onSaveQuery(searchQuery.trim());
    }
  };

  return (
    <div className={styles.searchBox}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(searchQuery);
        }}
      >
        <input
          ref={(e) => e?.focus()}
          type='text'
          placeholder='Search history...'
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          className={styles.searchInput}
          disabled={isLoading}
        />
        <button
          type='button'
          onClick={handleSaveQuery}
          className={styles.saveButton}
          disabled={isLoading || !searchQuery.trim()}
          title='Save query'
        >
          +
        </button>
      </form>
    </div>
  );
};
