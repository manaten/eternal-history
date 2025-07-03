import classNames from "classnames";
import { FC } from "react";

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
    <div className={classNames("flex flex-wrap gap-2", className)}>
      {queries.map((savedQuery) => (
        <div
          key={savedQuery.id}
          className={classNames(
            `
              flex items-stretch overflow-hidden rounded-lg border
              border-white/20 bg-white/10 text-white/80 shadow-sm
              backdrop-blur-[10px] transition-all duration-200
              hover:-translate-y-px hover:border-primary hover:bg-white/20
              hover:shadow-md
              active:translate-y-0
            `,
            currentQuery === savedQuery.query && "bg-white/30",
          )}
        >
          <button
            type='button'
            onClick={() => onQueryClick(savedQuery.query)}
            className={classNames(
              `
                max-w-[150px] cursor-pointer overflow-hidden border-none
                bg-transparent px-2.5 py-1.5 text-xs font-medium text-ellipsis
                whitespace-nowrap text-white transition-colors duration-200
                md:max-w-[200px] md:px-3 md:py-2 md:text-sm
              `,
              currentQuery === savedQuery.query && "font-semibold",
            )}
            title={t("savedQueries.searchForQuery", {
              query: savedQuery.query,
            })}
          >
            {savedQuery.query}
          </button>
          <button
            type='button'
            onClick={() => onQueryRemove(savedQuery.id)}
            className={`
              flex w-7 flex-shrink-0 cursor-pointer items-center justify-center
              border-l border-white/20 bg-transparent p-2 text-sm font-semibold
              text-white transition-all duration-200
              hover:bg-red-500 hover:text-white
              md:w-8 md:text-base
            `}
            title={t("savedQueries.removeSavedQuery")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
