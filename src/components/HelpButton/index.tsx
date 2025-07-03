import { FC } from "react";

import { t } from "../../i18n";

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      className={`
        fixed right-4 bottom-4 z-[100] flex h-12 w-12 cursor-pointer
        items-center justify-center rounded-full bg-slate-50 text-xl
        font-semibold text-gray-800 shadow-lg transition-all duration-200
        hover:-translate-y-0.5 hover:bg-slate-100 hover:text-gray-600
        active:translate-y-0
        md:right-6 md:bottom-6 md:h-14 md:w-14 md:text-2xl
      `}
      onClick={onClick}
      aria-label={t("helpButton.openHelp")}
      title={t("helpButton.help")}
    >
      ?
    </button>
  );
};
