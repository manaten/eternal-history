import classNames from "classnames";
import { FC, memo, useState } from "react";

import { Dropdown } from "./Dropdown";
import styles from "./HistoryItem.module.css";
import { highlightText } from "../lib/highlight";
import { HistoryItem as HistoryItemType } from "../types/HistoryItem";

interface HistoryItemProps {
  className?: string;
  item: HistoryItemType;
  searchQuery?: string;
  onDelete?: (item: HistoryItemType) => void;
}

// テキストハイライト用の関数
const renderHighlightedText = (
  text: string,
  searchQuery: string,
  type: "url" | "title",
) => {
  const highlighted = highlightText(text, searchQuery, type);
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
  className,
  item,
  searchQuery = "",
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const favicon = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;
  const time = new Date(item.lastVisitTime).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(true);
  };

  const dropdownItems = [
    {
      label: "Delete item",
      onClick: () => onDelete?.(item),
    },
  ];

  return (
    <a
      href={item.url}
      className={classNames(className, styles.historyItem)}
      title={item.title || item.url}
      onContextMenu={handleContextMenu}
      data-menu-open={isMenuOpen}
    >
      <span className={styles.time}>{time}</span>
      <img src={favicon} className={styles.icon} />
      <div className={styles.linkContainer}>
        <span className={styles.title} title={item.title || item.url}>
          {renderHighlightedText(item.title || item.url, searchQuery, "title")}
        </span>
        <span className={styles.url} title={item.url}>
          {renderHighlightedText(item.url, searchQuery, "url")}
        </span>
      </div>

      <Dropdown
        className={styles.contextDropdown}
        isOpen={isMenuOpen}
        items={dropdownItems}
        onClose={() => setIsMenuOpen(false)}
      />
    </a>
  );
});
