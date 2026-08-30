import { FC, useState } from "react";

import { HistoryItem } from "../../../../common/history/domain/types";
import { t } from "../../../i18n";
import { SavedQuery } from "../../../savedQueries";
import { ActionButton } from "../../common/ActionButton";
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
  truncatedAt?: number;
  onDeleteHistoryItem?: (item: HistoryItem) => void;
  initialSearchQuery?: string;
  onRequestSuggestions: (
    query: string,
    limit: number,
  ) => Promise<readonly string[]>;
  /** Options ボタン押下時の副作用。App.tsx が `chrome.runtime.openOptionsPage` を渡す。 */
  onOpenOptionsPage: () => void;
}

export const Root: FC<RootProps> = ({
  history,
  searchQuery,
  onSearch,
  onSaveQuery,
  savedQueries,
  onSavedQueryRemove,
  isLoading,
  truncatedAt,
  onDeleteHistoryItem,
  initialSearchQuery,
  onRequestSuggestions,
  onOpenOptionsPage,
}: RootProps) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleOpenHelp = () => {
    setIsHelpModalOpen(true);
  };

  const handleCloseHelp = () => {
    setIsHelpModalOpen(false);
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
        onRequestSuggestions={onRequestSuggestions}
      />
      <Histories
        history={history}
        isLoading={isLoading}
        searchQuery={searchQuery}
        truncatedAt={truncatedAt}
        onDeleteItem={onDeleteHistoryItem}
      />
      <ActionButton
        icon='options'
        onClick={onOpenOptionsPage}
        aria-label={t("optionsButton.openOptions")}
        title={t("optionsButton.options")}
        className={`
          fixed right-4 bottom-20 z-100
          md:right-6 md:bottom-[104px]
        `}
      />
      <ActionButton
        icon='help'
        onClick={handleOpenHelp}
        aria-label={t("helpButton.openHelp")}
        title={t("helpButton.help")}
        className={`
          fixed right-4 bottom-4 z-100
          md:right-6 md:bottom-6
        `}
      />
      <HelpModal isOpen={isHelpModalOpen} onClose={handleCloseHelp} />
    </main>
  );
};
