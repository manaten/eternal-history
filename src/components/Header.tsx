import { FC, memo, useState } from "react";

import styles from "./Header.module.css";
import { SavedQueries } from "./SavedQueries";
import { SearchBox } from "./SearchBox";
import { SavedQuery } from "../lib/savedQueries";

interface HeaderProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  savedQueries: SavedQuery[];
  onQueryRemove: (id: string) => void;
  isLoading: boolean;
}

export const Header: FC<HeaderProps> = memo(function Header({
  onSearch,
  onSaveQuery,
  savedQueries,
  onQueryRemove,
  isLoading,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleQueryClick = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <header className={styles.header}>
      <SearchBox
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
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
