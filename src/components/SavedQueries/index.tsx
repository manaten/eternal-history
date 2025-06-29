import classNames from "classnames";
import { FC } from "react";

import styles from "./index.module.css";
import { t } from "../../i18n";
import { SavedQuery } from "../../lib/savedQueries";

interface SavedQueriesProps {
  queries: SavedQuery[];
  onQueryClick: (query: string) => void;
  onQueryRemove: (id: string) => void;
  className?: string;
  currentQuery?: string;
}

export const SavedQueries: FC<SavedQueriesProps> = ({
  queries,
  onQueryClick,
  onQueryRemove,
  className,
  currentQuery,
}) => {
  if (queries.length === 0) {
    return null;
  }

  return (
    <div className={classNames(className, styles.savedQueries)}>
      {queries.map((savedQuery) => (
        <div
          key={savedQuery.id}
          className={classNames(
            styles.savedQuery,
            currentQuery === savedQuery.query && styles["savedQuery--active"],
          )}
        >
          <button
            type='button'
            onClick={() => onQueryClick(savedQuery.query)}
            className={styles.queryButton}
            title={t("searchForQuery").replace("{query}", savedQuery.query)}
          >
            {savedQuery.query}
          </button>
          <button
            type='button'
            onClick={() => onQueryRemove(savedQuery.id)}
            className={styles.removeButton}
            title={t("removeSavedQuery")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
