import classNames from "classnames";
import { FC, useRef, useEffect } from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownProps {
  className?: string;
  isOpen: boolean;
  items: DropdownItem[];
  onClose: () => void;
}

export const Dropdown: FC<DropdownProps> = ({
  className,
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
        "absolute bg-slate-50 border border-gray-200 rounded-lg shadow-lg z-[1000] min-w-[160px] overflow-hidden md:min-w-[140px]",
        className,
      )}
      ref={dropdownRef}
      role='menu'
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={classNames(
            "block w-full px-4 py-3 bg-transparent border-none text-gray-800 text-sm text-left cursor-pointer transition-colors duration-200",
            "hover:bg-slate-100 active:bg-emerald-50",
            "md:px-3 md:py-2 md:text-xs",
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
