import { FC, memo, useState, useCallback } from "react";

import { t } from "../../i18n";
import { HistoryItem as HistoryItemType } from "../../types/HistoryItem";
import { Dropdown } from "../Dropdown";
import { HistoryItem } from "../HistoryItem";
import { Spinner } from "../Spinner";

interface HistoriesProps {
  history: HistoryItemType[];
  isLoading: boolean;
  searchQuery?: string;
  onDeleteItem?: (item: HistoryItemType) => void;
}

export const Histories: FC<HistoriesProps> = memo(function Histories({
  history,
  isLoading,
  searchQuery = "",
  onDeleteItem,
}) {
  const [dropdownState, setDropdownState] = useState<{
    isOpen: boolean;
    item: HistoryItemType | null;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    item: null,
    position: { x: 0, y: 0 },
  });

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: HistoryItemType) => {
      e.preventDefault();
      e.stopPropagation();
      setDropdownState({
        isOpen: true,
        item,
        position: { x: e.clientX, y: e.clientY },
      });
    },
    [],
  );

  const closeDropdown = useCallback(() => {
    setDropdownState((prev) => ({ ...prev, isOpen: false }));
  }, []);
  if (isLoading) {
    return (
      <div className='flex min-h-[200px] items-center justify-center p-16'>
        <Spinner size='large' />
      </div>
    );
  }

  const groupHistoriesByDate = (histories: HistoryItemType[]) => {
    return histories.reduce<Record<string, HistoryItemType[]>>(
      (groups, item) => {
        const date = new Date(item.lastVisitTime);
        const dateKey = date.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return {
          ...groups,
          [dateKey]: [...(groups[dateKey] ?? []), item],
        };
      },
      {},
    );
  };

  const entries = Object.entries(groupHistoriesByDate(history))
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime(),
    )
    .map(
      ([date, items]) =>
        [
          date,
          [...items].sort((a, b) => b.lastVisitTime - a.lastVisitTime),
        ] as const,
    );

  return (
    <div
      className={`
        flex flex-1 flex-col gap-4 rounded-xl bg-white p-4 shadow-md
        backdrop-blur-[10px]
        md:gap-6 md:p-6
      `}
    >
      {entries.map(([date, items]) => (
        <div key={date} className='flex flex-col gap-3'>
          <div
            className={`
              border-b border-gray-200 px-3 py-2 text-xs font-medium
              text-gray-700
              md:text-sm
            `}
          >
            {date}
          </div>
          <div className='flex flex-col gap-0.5'>
            {items.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                searchQuery={searchQuery}
                isMenuOpen={
                  dropdownState.isOpen && dropdownState.item?.id === item.id
                }
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </div>
      ))}

      {dropdownState.isOpen &&
        dropdownState.item &&
        (() => {
          const item = dropdownState.item;
          return (
            <Dropdown
              style={{
                position: "fixed",
                left: `${dropdownState.position.x}px`,
                top: `${dropdownState.position.y}px`,
              }}
              isOpen={dropdownState.isOpen}
              items={[
                {
                  label: t("historyItem.openInNewTab"),
                  onClick: () => {
                    window.open(item.url, "_blank");
                  },
                },
                {
                  label: t("historyItem.copyLink"),
                  onClick: async () => {
                    try {
                      await navigator.clipboard.writeText(item.url);
                    } catch (error) {
                      console.error("Failed to copy URL:", error);
                    }
                  },
                },
                {
                  label: t("historyItem.copyRichText"),
                  onClick: async () => {
                    try {
                      const html = `<a href="${item.url}">${item.title || item.url}</a>`;
                      const text = item.title
                        ? `${item.title} (${item.url})`
                        : item.url;

                      const clipboardData = new ClipboardItem({
                        "text/html": new Blob([html], { type: "text/html" }),
                        "text/plain": new Blob([text], { type: "text/plain" }),
                      });

                      await navigator.clipboard.write([clipboardData]);
                    } catch (error) {
                      console.error("Failed to copy rich text:", error);
                    }
                  },
                },
                {
                  label: t("historyItem.deleteItem"),
                  onClick: () => onDeleteItem?.(item),
                },
              ]}
              onClose={closeDropdown}
            />
          );
        })()}
    </div>
  );
});
