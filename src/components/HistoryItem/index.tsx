import classNames from "classnames";
import { FC, memo, useState } from "react";

import { t } from "../../i18n";
import { highlightText } from "../../lib/highlight";
import { HistoryItem as HistoryItemType } from "../../types/HistoryItem";
import { Dropdown } from "../Dropdown";

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
        <mark
          key={index}
          className='rounded bg-yellow-100 px-1 py-0.5 text-yellow-900'
        >
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

  const favicon =
    item.favicon ||
    `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`;
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
          const text = item.title ? `${item.title} (${item.url})` : item.url;

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
      onClick: () => onDelete?.(item),
    },
  ];

  return (
    <a
      href={item.url}
      className={classNames(
        `
          relative flex max-w-full items-center gap-3 rounded-lg border
          border-transparent p-2 text-sm text-inherit no-underline
          transition-colors duration-100
          hover:border-gray-200 hover:bg-slate-100 hover:shadow-sm
          active:shadow-none
        `,
        isMenuOpen && "bg-slate-100 border-gray-200 shadow-sm",
        className,
      )}
      title={item.title || item.url}
      onContextMenu={handleContextMenu}
    >
      <span
        className={`
          min-w-[2.5rem] text-right text-xs font-medium text-gray-400
          md:min-w-[3rem] md:text-sm
        `}
      >
        {time}
      </span>
      <img
        src={favicon}
        className={`
          size-4 flex-shrink-0 rounded object-cover
          md:size-5
        `}
      />
      <div
        className={`
          flex w-full min-w-0 flex-grow flex-col items-start gap-1 text-left
          leading-normal
        `}
      >
        <span
          className={`
            w-full min-w-0 overflow-hidden text-sm leading-normal font-medium
            text-ellipsis whitespace-nowrap text-gray-800
          `}
          title={item.title || item.url}
        >
          {renderHighlightedText(item.title || item.url, searchQuery, "title")}
        </span>
        <span
          className={`
            w-full min-w-0 overflow-hidden text-xs font-normal text-ellipsis
            whitespace-nowrap text-gray-400
          `}
          title={item.url}
        >
          {renderHighlightedText(item.url, searchQuery, "url")}
        </span>
      </div>

      <Dropdown
        className='top-[calc(100%-0.5rem)] right-1 z-10'
        isOpen={isMenuOpen}
        items={dropdownItems}
        onClose={() => setIsMenuOpen(false)}
      />
    </a>
  );
});
