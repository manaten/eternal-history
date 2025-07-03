import { FC } from "react";

import { t } from "../../i18n";

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      className='fixed bottom-6 right-6 w-14 h-14 rounded-full bg-slate-50 text-gray-800 text-2xl font-semibold cursor-pointer shadow-lg transition-all duration-200 z-[100] flex items-center justify-center hover:text-gray-600 hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 md:bottom-4 md:right-4 md:w-12 md:h-12 md:text-xl'
      onClick={onClick}
      aria-label={t("helpButton.openHelp")}
      title={t("helpButton.help")}
    >
      ?
    </button>
  );
};
