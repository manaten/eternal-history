import classNames from "classnames";
import { FC } from "react";

import styles from "./index.module.css";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = "medium", className }) => {
  return (
    <div className={classNames(styles.spinner, className)} data-size={size}>
      <div className={styles.circle} />
    </div>
  );
};
