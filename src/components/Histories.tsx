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
  const groupHistoriesByDate = (histories: HistoryItemType[]) => {
    const groups: { [key: string]: HistoryItemType[] } = {};
    histories.forEach((item) => {
      const date = new Date(item.lastVisitTime);
      const dateKey = date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.histories}>
      {Object.entries(groupHistoriesByDate(history)).map(([date, items]) => (
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
