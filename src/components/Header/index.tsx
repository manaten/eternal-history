import { FC, memo, useState } from "react";

import styles from "./index.module.css";
import { SavedQuery } from "../../lib/savedQueries";
import { SavedQueries } from "../SavedQueries";
import { SearchBox } from "../SearchBox";

interface HeaderProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  savedQueries: SavedQuery[];
  onSavedQueryRemove: (id: string) => void;
  isLoading: boolean;
  currentQuery?: string;
}

export const Header: FC<HeaderProps> = memo(function Header({
  onSearch,
  onSaveQuery,
  savedQueries,
  onSavedQueryRemove,
  isLoading,
  currentQuery,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSavedQueryClick = (query: string) => {
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
        onQueryClick={handleSavedQueryClick}
        onQueryRemove={onSavedQueryRemove}
        currentQuery={currentQuery}
      />
    </header>
  );
});
