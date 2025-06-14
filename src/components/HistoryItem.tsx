import { FC, memo } from "react";

import styles from "./HistoryItem.module.css";
import { HistoryItem as HistoryItemType } from "../types/HistoryItem";

interface HistoryItemProps {
  item: HistoryItemType;
}

export const HistoryItem: FC<HistoryItemProps> = memo(function HistoryItem({
  item,
}) {
  const favicon = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;
  const time = new Date(item.lastVisitTime).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <a
      href={item.url}
      className={styles.historyItem}
      title={item.title || item.url}
    >
      <span className={styles.time}>{time}</span>
      <img src={favicon} className={styles.icon} />
      <div className={styles.linkContainer}>
        <span className={styles.title}>
          {item.title?.slice(0, 100) || item.url?.slice(0, 100)}
        </span>
        <span className={styles.url} title={item.url}>
          {item.url?.slice(0, 100)}
        </span>
      </div>
    </a>
  );
});
