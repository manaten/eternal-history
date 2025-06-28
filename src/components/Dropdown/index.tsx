import classNames from "classnames";
import { FC, useRef, useEffect } from "react";

import styles from "./index.module.css";

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
      className={classNames(styles.dropdown, className)}
      ref={dropdownRef}
      role='menu'
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={styles.dropdownItem}
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
