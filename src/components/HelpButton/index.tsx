import { FC } from "react";

import styles from "./index.module.css";

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      className={styles.helpButton}
      onClick={onClick}
      aria-label='ヘルプを開く'
      title='ヘルプ'
    >
      ?
    </button>
  );
};
