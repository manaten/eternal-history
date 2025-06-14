import { FC, memo } from "react";

import styles from "./Header.module.css";
import { SearchBox } from "./SearchBox";

interface HeaderProps {
  historyCount: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const Header: FC<HeaderProps> = memo(function Header({
  historyCount,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isLoading,
}) {
  return (
    <header className={styles.header}>
      <SearchBox
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearch={onSearch}
        isLoading={isLoading}
      />
      <div className={styles.count}>
        <p>{historyCount} histories</p>
      </div>
    </header>
  );
});
