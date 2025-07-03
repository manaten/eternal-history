import { FC, useState } from "react";

import { SavedQuery } from "../../lib/savedQueries";
import { HistoryItem } from "../../types/HistoryItem";
import { Header } from "../Header";
import { HelpButton } from "../HelpButton";
import { HelpModal } from "../HelpModal";
import { Histories } from "../Histories";

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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleOpenHelp = () => {
    setIsHelpModalOpen(true);
  };

  const handleCloseHelp = () => {
    setIsHelpModalOpen(false);
  };

  return (
    <main className='w-full max-w-[900px] mx-auto px-6 py-8 flex items-stretch flex-col gap-6 min-h-screen md:px-4 md:py-4 md:gap-4'>
      <Header
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        savedQueries={savedQueries}
        onSavedQueryRemove={onSavedQueryRemove}
        isLoading={isLoading}
        currentQuery={searchQuery}
      />
      <Histories
        history={history}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onDeleteItem={onDeleteHistoryItem}
      />
      <HelpButton onClick={handleOpenHelp} />
      <HelpModal isOpen={isHelpModalOpen} onClose={handleCloseHelp} />
    </main>
  );
};
