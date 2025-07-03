import classNames from "classnames";
import { FC } from "react";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = "medium", className }) => {
  const sizeClasses = {
    small: "w-4 h-4 border",
    medium: "w-6 h-6 border-2",
    large: "w-8 h-8 border-[3px]",
  };

  return (
    <div
      className={classNames(
        "inline-flex items-center justify-center",
        className,
      )}
    >
      <div
        className={classNames(
          "animate-spin rounded-full border-white/20 border-t-primary",
          sizeClasses[size],
        )}
      />
    </div>
  );
};
