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
      <div className='flex justify-center items-center p-16 min-h-[200px]'>
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
    <div className='flex flex-col gap-6 p-6 bg-white rounded-xl shadow-md border border-white/20 backdrop-blur-[10px] flex-1 md:p-4 md:gap-4'>
      {entries.map(([date, items]) => (
        <div key={date} className='flex flex-col gap-3'>
          <div className='text-sm font-medium text-gray-700 px-1 py-2 border-b border-gray-200 md:px-3 md:py-2 md:text-[0.8rem]'>
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
