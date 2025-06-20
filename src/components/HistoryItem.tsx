import { FC, memo, useState, useRef, useEffect } from "react";

import styles from "./HistoryItem.module.css";
import { highlightText } from "../lib/highlight";
import { HistoryItem as HistoryItemType } from "../types/HistoryItem";

interface HistoryItemProps {
  item: HistoryItemType;
  searchQuery?: string;
  onDelete?: (item: HistoryItemType) => void;
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
  onDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const favicon = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;
  const time = new Date(item.lastVisitTime).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.(item);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [isMenuOpen]);

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
      {onDelete && (
        <div className={styles.menuContainer} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={handleMenuClick}
            title='More options'
            aria-label='More options'
          >
            ⋮
          </button>
          {isMenuOpen && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={handleDeleteClick}
              >
                Delete item
              </button>
            </div>
          )}
        </div>
      )}
    </a>
  );
});
