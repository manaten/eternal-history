import { FC, memo } from "react";

import styles from "./HistoryItem.module.css";
import { highlightText } from "../lib/highlight";
import { HistoryItem as HistoryItemType } from "../types/HistoryItem";

interface HistoryItemProps {
  item: HistoryItemType;
  searchQuery?: string;
}

// テキストハイライト用の関数
const renderHighlightedText = (text: string, searchQuery: string) => {
  const highlighted = highlightText(text, searchQuery);
  return highlighted.map((part, index) => {
    if (part.highlight) {
      return (
        <mark key={index} className={styles.highlight}>
          {part.content}
        </mark>
      );
    }
    return part.content;
  });
};

export const HistoryItem: FC<HistoryItemProps> = memo(function HistoryItem({
  item,
  searchQuery = "",
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
        <span className={styles.title} title={item.title || item.url}>
          {renderHighlightedText(item.title || item.url, searchQuery)}
        </span>
        <span className={styles.url} title={item.url}>
          {renderHighlightedText(item.url, searchQuery)}
        </span>
      </div>
    </a>
  );
});
