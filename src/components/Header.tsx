import { FC, memo } from "react";

import styles from "./Header.module.css";
import { SearchBox } from "./SearchBox";

interface HeaderProps {
  historyCount: number;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const Header: FC<HeaderProps> = memo(function Header({
  historyCount,
  onSearch,
  isLoading,
}) {
  return (
    <header className={styles.header}>
      <SearchBox onSearch={onSearch} isLoading={isLoading} />
      <div className={styles.count}>
        <p>{historyCount} histories</p>
      </div>
    </header>
  );
});
