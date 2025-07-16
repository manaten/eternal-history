import classNames from "classnames";
import { FC, useRef, useEffect } from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownProps {
  className?: string;
  style?: React.CSSProperties;
  isOpen: boolean;
  items: DropdownItem[];
  onClose: () => void;
}

export const Dropdown: FC<DropdownProps> = ({
  className,
  style,
  isOpen,
  items,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={classNames(
        `
          absolute min-w-[140px] overflow-hidden rounded-lg border
          border-gray-200 bg-slate-50 shadow-lg
          md:min-w-[160px]
        `,
        className,
      )}
      style={style}
      ref={dropdownRef}
      role='menu'
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={classNames(
            `
              block w-full cursor-pointer border-none bg-transparent px-3 py-2
              text-left text-xs text-gray-800 transition-colors duration-200
              hover:bg-slate-100
              active:bg-emerald-50
              md:px-4 md:py-3 md:text-sm
            `,
            item.disabled &&
              "text-gray-400 cursor-not-allowed opacity-60 hover:bg-transparent active:bg-transparent",
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
