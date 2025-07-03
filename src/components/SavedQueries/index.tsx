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
            "flex items-stretch overflow-hidden shadow-sm transition-all duration-200 bg-white/10 text-white/80 border border-white/20 rounded-lg backdrop-blur-[10px]",
            "hover:-translate-y-px hover:shadow-md hover:border-primary hover:bg-white/20",
            currentQuery === savedQuery.query && "bg-white/30",
          )}
        >
          <button
            type='button'
            onClick={() => onQueryClick(savedQuery.query)}
            className={classNames(
              "bg-transparent border-none px-3 py-2 text-sm font-medium text-white cursor-pointer transition-colors duration-200 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis",
              "md:px-2.5 md:py-1.5 md:text-[0.8125rem] md:max-w-[150px]",
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
            className='bg-transparent border-none p-2 text-base font-semibold text-white cursor-pointer transition-all duration-200 border-l border-white/20 flex items-center justify-center w-8 flex-shrink-0 hover:bg-red-500 hover:text-white md:w-7 md:text-sm'
            title={t("savedQueries.removeSavedQuery")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
