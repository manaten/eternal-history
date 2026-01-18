import classNames from "classnames";
import { FC } from "react";

import { t } from "../../i18n";

type IconType = "help" | "options";

const GearIcon: FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
    <circle cx='12' cy='12' r='3' />
  </svg>
);

const ICON_CONFIG: Record<
  IconType,
  {
    icon: React.ReactNode;
    ariaLabelKey: "helpButton.openHelp" | "optionsButton.openOptions";
    titleKey: "helpButton.help" | "optionsButton.options";
  }
> = {
  help: {
    icon: "?",
    ariaLabelKey: "helpButton.openHelp",
    titleKey: "helpButton.help",
  },
  options: {
    icon: <GearIcon />,
    ariaLabelKey: "optionsButton.openOptions",
    titleKey: "optionsButton.options",
  },
};

interface FloatingButtonProps {
  icon: IconType;
  onClick: () => void;
  className?: string;
}

export const FloatingButton: FC<FloatingButtonProps> = ({
  icon,
  onClick,
  className,
}) => {
  const config = ICON_CONFIG[icon];

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
      aria-label={t(config.ariaLabelKey)}
      title={t(config.titleKey)}
    >
      {config.icon}
    </button>
  );
};
