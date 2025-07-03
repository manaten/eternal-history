import { FC, memo } from "react";

import { HistoryItem as HistoryItemType } from "../../types/HistoryItem";
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
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
