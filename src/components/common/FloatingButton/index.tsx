import SettingsIcon from "@material-design-icons/svg/outlined/settings.svg?react";
import classNames from "classnames";
import { ComponentPropsWithoutRef, FC } from "react";

type IconType = "help" | "options";

const ICONS: Record<IconType, React.ReactNode> = {
  help: "?",
  options: <SettingsIcon />,
};

interface FloatingButtonProps extends ComponentPropsWithoutRef<"button"> {
  icon: IconType;
  className?: string;
}

export const FloatingButton: FC<FloatingButtonProps> = ({
  icon,
  className,
  ...props
}) => {
  return (
    <button
      className={classNames(
        `
          fixed right-4 z-100 flex size-12 cursor-pointer items-center
          justify-center rounded-full bg-slate-50 text-xl font-semibold
          text-gray-800 shadow-lg transition-all duration-200
          hover:-translate-y-0.5 hover:bg-slate-100 hover:text-gray-600
          active:translate-y-0
          md:right-6 md:size-14 md:text-2xl
        `,
        className,
      )}
      {...props}
    >
      {ICONS[icon]}
    </button>
  );
};
