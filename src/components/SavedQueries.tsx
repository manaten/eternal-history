import classNames from "classnames";
import { FC } from "react";

import styles from "./SavedQueries.module.css";
import { SavedQuery } from "../lib/savedQueries";

interface SavedQueriesProps {
  queries: SavedQuery[];
  onQueryClick: (query: string) => void;
  onQueryRemove: (id: string) => void;
  className?: string;
}

export const SavedQueries: FC<SavedQueriesProps> = ({
  queries,
  onQueryClick,
  onQueryRemove,
  className,
}) => {
  if (queries.length === 0) {
    return null;
  }

  return (
    <div className={classNames(className, styles.savedQueries)}>
      {queries.map((savedQuery) => (
        <div key={savedQuery.id} className={styles.tag}>
          <button
            type='button'
            onClick={() => onQueryClick(savedQuery.query)}
            className={styles.tagButton}
            title={`Search for: ${savedQuery.query}`}
          >
            {savedQuery.query}
          </button>
          <button
            type='button'
            onClick={() => onQueryRemove(savedQuery.id)}
            className={styles.removeButton}
            title='Remove saved query'
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
