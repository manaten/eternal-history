import classNames from "classnames";
import { FC, ReactNode } from "react";

interface FloatingButtonProps {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  title: string;
  className?: string;
}

export const FloatingButton: FC<FloatingButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  title,
  className,
}) => {
  return (
    <button
      className={classNames(
        `
          fixed right-4 z-[100] flex h-12 w-12 cursor-pointer items-center
          justify-center rounded-full bg-slate-50 text-xl font-semibold
          text-gray-800 shadow-lg transition-all duration-200
          hover:-translate-y-0.5 hover:bg-slate-100 hover:text-gray-600
          active:translate-y-0
          md:right-6 md:h-14 md:w-14 md:text-2xl
        `,
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {icon}
    </button>
  );
};
