import classNames from "classnames";
import { ComponentPropsWithoutRef, FC } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-white shadow-md
    hover:bg-primary-hover hover:shadow-lg
  `,
  secondary: `
    border border-gray-300 bg-white text-gray-700 shadow-sm
    hover:bg-gray-50 hover:shadow-md
  `,
};

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={classNames(
        `
          rounded-lg px-6 py-2.5 text-sm font-semibold transition-all
          active:translate-y-0.5
        `,
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
