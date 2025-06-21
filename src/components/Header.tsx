import { FC, memo } from "react";

import styles from "./Header.module.css";
import { SavedQueries } from "./SavedQueries";
import { SearchBox } from "./SearchBox";
import { SavedQuery } from "../lib/savedQueries";

interface HeaderProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  savedQueries: SavedQuery[];
  onQueryRemove: (id: string) => void;
  isLoading: boolean;
}

export const Header: FC<HeaderProps> = memo(function Header({
  onSearch,
  onSaveQuery,
  searchQuery,
  onSearchQueryChange,
  savedQueries,
  onQueryRemove,
  isLoading,
}) {
  const handleQueryClick = (query: string) => {
    onSearchQueryChange(query);
    onSearch(query);
  };

  return (
    <header className={styles.header}>
      <SearchBox
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        isLoading={isLoading}
      />
      <SavedQueries
        queries={savedQueries}
        onQueryClick={handleQueryClick}
        onQueryRemove={onQueryRemove}
      />
    </header>
  );
});
