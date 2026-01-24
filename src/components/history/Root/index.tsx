import { FC, useState } from "react";

import { t } from "../../../i18n";
import { SavedQuery } from "../../../lib/savedQueries";
import { HistoryItem } from "../../../types/HistoryItem";
import { FloatingButton } from "../../common/FloatingButton";
import { Header } from "../Header";
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
  initialSearchQuery?: string;
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
  initialSearchQuery,
}: RootProps) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleOpenHelp = () => {
    setIsHelpModalOpen(true);
  };

  const handleCloseHelp = () => {
    setIsHelpModalOpen(false);
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <main
      className={`
        mx-auto flex min-h-screen w-full max-w-[900px] flex-col items-stretch
        gap-4 p-4
        md:gap-6 md:px-6 md:py-8
      `}
    >
      <Header
        onSearch={onSearch}
        onSaveQuery={onSaveQuery}
        savedQueries={savedQueries}
        onSavedQueryRemove={onSavedQueryRemove}
        isLoading={isLoading}
        currentQuery={searchQuery}
        initialQuery={initialSearchQuery}
      />
      <Histories
        history={history}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onDeleteItem={onDeleteHistoryItem}
      />
      <FloatingButton
        icon='options'
        onClick={handleOpenOptions}
        aria-label={t("optionsButton.openOptions")}
        title={t("optionsButton.options")}
        className={`
          bottom-20
          md:bottom-[104px]
        `}
      />
      <FloatingButton
        icon='help'
        onClick={handleOpenHelp}
        aria-label={t("helpButton.openHelp")}
        title={t("helpButton.help")}
        className={`
          bottom-4
          md:bottom-6
        `}
      />
      <HelpModal isOpen={isHelpModalOpen} onClose={handleCloseHelp} />
    </main>
  );
};
