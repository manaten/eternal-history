import { FC, useMemo } from "react";

import { t } from "../../i18n";
import { HistoryItem } from "../../types/HistoryItem";
import { Dropdown } from "../Dropdown";

interface HistoryDropdownProps {
  item: HistoryItem;
  position: { x: number; y: number };
  onDelete?: (item: HistoryItem) => void;
  onClose: () => void;
}

export const HistoryDropdown: FC<HistoryDropdownProps> = ({
  item,
  position,
  onDelete,
  onClose,
}) => {
  const items = useMemo(
    () => [
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
            const html = `<a href="${item.url}">${item.title ?? item.url}</a>`;
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
    ],
    [item, onDelete],
  );

  return (
    <Dropdown
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      isOpen
      items={items}
      onClose={onClose}
    />
  );
};
