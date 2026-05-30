import { FC, memo, useState } from "react";

import { SavedQuery } from "../../../domain/savedQueries";
import { SavedQueries } from "../SavedQueries";
import { SearchBox } from "../SearchBox";

interface HeaderProps {
  onSearch: (query: string) => void;
  onSaveQuery?: (query: string) => void;
  savedQueries: SavedQuery[];
  onSavedQueryRemove: (id: string) => void;
  isLoading: boolean;
  currentQuery?: string;
  initialQuery?: string;
  onRequestSuggestions: (
    query: string,
    limit: number,
  ) => Promise<readonly string[]>;
}

export const Header: FC<HeaderProps> = memo(function Header({
  onSearch,
  onSaveQuery,
  savedQueries,
  onSavedQueryRemove,
  isLoading,
  currentQuery,
  initialQuery = "",
  onRequestSuggestions,
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSavedQueryClick = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <header className='flex flex-col gap-4'>
      <SearchBox
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isLoading={isLoading}
        onRequestSuggestions={onRequestSuggestions}
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
