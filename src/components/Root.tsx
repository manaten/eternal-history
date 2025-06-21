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
  onSaveQuery?: (query: string) => void;
  savedQueries: SavedQuery[];
  onSavedQueryRemove: (id: string) => void;
  isLoading: boolean;
  onDeleteHistoryItem?: (item: HistoryItem) => void;
}

export const Root: FC<RootProps> = ({
  history,
  searchQuery,
  onSearch,
  onSaveQuery,
  savedQueries,
  onSavedQueryRemove,
  isLoading,
  onDeleteHistoryItem,
}: RootProps) => {
  return (
    <main className={styles.root}>
      <Header
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        savedQueries={savedQueries}
        onSavedQueryRemove={onSavedQueryRemove}
        isLoading={isLoading}
      />
      <Histories
        history={history}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onDeleteItem={onDeleteHistoryItem}
      />
    </main>
  );
};
