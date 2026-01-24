import { FC, memo, useState, useCallback } from "react";

import { HistoryItem as HistoryItemType } from "../../../types/HistoryItem";
import { Spinner } from "../../common/Spinner";
import { HistoryDropdown } from "../HistoryDropdown";
import { HistoryItem } from "../HistoryItem";

interface HistoriesProps {
  history: HistoryItemType[];
  isLoading: boolean;
  searchQuery?: string;
  onDeleteItem?: (item: HistoryItemType) => void;
}

const groupHistoriesByDate = (histories: HistoryItemType[]) => {
  const grouped = histories.reduce<Record<string, HistoryItemType[]>>(
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

  return Object.entries(grouped)
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
};

export const Histories: FC<HistoriesProps> = memo(function Histories({
  history,
  isLoading,
  searchQuery = "",
  onDeleteItem,
}) {
  const [dropdownState, setDropdownState] = useState<{
    item: HistoryItemType;
    position: { x: number; y: number };
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: HistoryItemType) => {
      e.preventDefault();
      e.stopPropagation();

      if (!(e.currentTarget instanceof HTMLElement)) {
        return;
      }

      const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect();
      setDropdownState({
        item,
        position: {
          x: e.clientX - (parentRect?.left ?? 0),
          y: e.clientY - (parentRect?.top ?? 0),
        },
      });
    },
    [],
  );

  const closeDropdown = useCallback(() => {
    setDropdownState(null);
  }, []);

  if (isLoading) {
    return (
      <div className='flex min-h-[200px] items-center justify-center p-16'>
        <Spinner size='large' />
      </div>
    );
  }

  const entries = groupHistoriesByDate(history);

  return (
    <div
      className={`
        relative flex flex-1 flex-col gap-4 rounded-xl bg-white p-4 shadow-md
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
                isMenuOpen={dropdownState?.item.id === item.id}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </div>
      ))}

      {dropdownState && (
        <HistoryDropdown
          item={dropdownState.item}
          position={dropdownState.position}
          onDelete={onDeleteItem}
          onClose={closeDropdown}
        />
      )}
    </div>
  );
});
