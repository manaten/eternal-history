import { FC } from "react";

import styles from "../App.module.css";
import { Header } from "./Header";
import { Histories } from "./Histories";
import { HistoryItem } from "../types/HistoryItem";

interface RootProps {
  history: HistoryItem[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (query?: string) => void;
  isLoading: boolean;
}

export const Root: FC<RootProps> = ({
  history,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isLoading,
}: RootProps) => {
  return (
    <main className={styles.root}>
      <Header
        historyCount={history.length}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearch={onSearch}
        isLoading={isLoading}
      />
      <Histories history={history} isLoading={isLoading} />
    </main>
  );
};
