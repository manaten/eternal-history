import classNames from "classnames";
import { ComponentPropsWithoutRef, FC, memo } from "react";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary";
}

export const Button: FC<ButtonProps> = memo(
  ({ variant = "primary", className, children, ...props }) => {
    return (
      <button
        className={classNames(
          `
            rounded-lg px-6 py-2.5 text-sm font-semibold transition-all
            not-disabled:cursor-pointer
            not-disabled:active:translate-y-0.5
          `,
          variant === "primary" &&
            `
            bg-theme-base text-white shadow-md
            not-disabled:hover:bg-theme-hover not-disabled:hover:shadow-lg
          `,
          variant === "secondary" &&
            `
            border border-gray-300 bg-white text-gray-700 shadow-sm
            not-disabled:hover:bg-gray-50 not-disabled:hover:shadow-md
          `,
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
