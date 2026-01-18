import { FC } from "react";

import { t } from "../../i18n";
import { FloatingButton } from "../FloatingButton";

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <FloatingButton
      icon='?'
      onClick={onClick}
      ariaLabel={t("helpButton.openHelp")}
      title={t("helpButton.help")}
      className={`
        bottom-4
        md:bottom-6
      `}
    />
  );
};
