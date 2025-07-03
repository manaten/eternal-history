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
          className='bg-yellow-100 text-yellow-900 px-1 py-0.5 rounded'
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
      label: t("historyItem.deleteItem"),
      onClick: () => onDelete?.(item),
    },
  ];

  return (
    <a
      href={item.url}
      className={classNames(
        "max-w-full flex items-center gap-3 px-3 py-2 text-sm no-underline text-inherit rounded-lg transition-colors duration-200 border border-transparent relative",
        "hover:bg-slate-100 hover:border-gray-200 hover:shadow-sm",
        "active:shadow-none",
        "md:p-2 md:gap-3",
        isMenuOpen && "bg-slate-100 border-gray-200 shadow-sm",
        className,
      )}
      title={item.title || item.url}
      onContextMenu={handleContextMenu}
    >
      <span className='text-gray-400 text-xs font-medium min-w-[3rem] text-right md:min-w-[2.5rem] md:text-[0.7rem]'>
        {time}
      </span>
      <img
        src={favicon}
        className='w-[18px] h-[18px] flex-shrink-0 rounded object-cover md:w-4 md:h-4'
      />
      <div className='flex items-start gap-1 flex-col flex-grow text-left min-w-0 w-full leading-normal'>
        <span
          className='font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap w-full min-w-0 leading-normal text-sm md:text-[0.8rem]'
          title={item.title || item.url}
        >
          {renderHighlightedText(item.title || item.url, searchQuery, "title")}
        </span>
        <span
          className='text-gray-400 text-xs overflow-hidden text-ellipsis whitespace-nowrap w-full min-w-0 font-normal md:text-[0.7rem]'
          title={item.url}
        >
          {renderHighlightedText(item.url, searchQuery, "url")}
        </span>
      </div>

      <Dropdown
        className='top-[calc(100%-0.5rem)] right-1'
        isOpen={isMenuOpen}
        items={dropdownItems}
        onClose={() => setIsMenuOpen(false)}
      />
    </a>
  );
});
