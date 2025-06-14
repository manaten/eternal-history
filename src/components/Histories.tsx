import { FC, memo } from "react";

import styles from "./Histories.module.css";
import { HistoryItem } from "./HistoryItem";
import { HistoryItem as HistoryItemType } from "../types/HistoryItem";

interface HistoriesProps {
  history: HistoryItemType[];
  isLoading: boolean;
}

export const Histories: FC<HistoriesProps> = memo(function Histories({
  history,
  isLoading,
}) {
  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
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
    <div className={styles.histories}>
      {entries.map(([date, items]) => (
        <div key={date} className={styles.dateGroup}>
          <div className={styles.dateHeader}>{date}</div>
          <div className={styles.dateItems}>
            {items.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
