import { FC } from "react";

import styles from "./index.module.css";
import { t } from "../../i18n";

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      className={styles.helpButton}
      onClick={onClick}
      aria-label={t("openHelp")}
      title={t("help")}
    >
      ?
    </button>
  );
};
