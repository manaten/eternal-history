import { FC } from "react";

import styles from "../App.module.css";
import { Header } from "./Header";
import { Histories } from "./Histories";
import { SavedQuery } from "../lib/savedQueries";
import { HistoryItem } from "../types/HistoryItem";

interface RootProps {
  history: HistoryItem[];
  searchQuery: string;
  onSearch: (query?: string) => void;
  onSearchQueryChange: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  savedQueries: SavedQuery[];
  onQueryRemove: (id: string) => void;
  isLoading: boolean;
  onDeleteItem?: (item: HistoryItem) => void;
}

export const Root: FC<RootProps> = ({
  history,
  searchQuery,
  onSearch,
  onSearchQueryChange,
  onSaveQuery,
  savedQueries,
  onQueryRemove,
  isLoading,
  onDeleteItem,
}: RootProps) => {
  return (
    <main className={styles.root}>
      <Header
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        savedQueries={savedQueries}
        onQueryRemove={onQueryRemove}
        isLoading={isLoading}
      />
      <Histories
        history={history}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onDeleteItem={onDeleteItem}
      />
    </main>
  );
};
