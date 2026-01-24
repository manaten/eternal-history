import classNames from "classnames";
import { ComponentPropsWithoutRef, FC, memo } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-white shadow-md
    not-disabled:hover:bg-primary-hover not-disabled:hover:shadow-lg
  `,
  secondary: `
    border border-gray-300 bg-white text-gray-700 shadow-sm
    not-disabled:hover:bg-gray-50 not-disabled:hover:shadow-md
  `,
};

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
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
