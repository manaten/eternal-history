import { FC } from "react";

import styles from "./index.module.css";
import { t } from "../../i18n";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <style>
        {`
          body {
            overflow: hidden;
          }
        `}
      </style>

      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t("helpModal.howToUse")}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("helpModal.closeModal")}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t("helpModal.aboutThisExtension")}
            </h3>
            <p className={styles.text}>{t("helpModal.aboutDescription")}</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t("helpModal.searchSyntax")}
            </h3>
            <div className={styles.syntaxList}>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>search term</code>
                <span className={styles.description}>
                  {t("helpModal.searchPhrase")}
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>site:example.com</code>
                <span className={styles.description}>
                  {t("helpModal.searchSite")}
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>-exclude</code>
                <span className={styles.description}>
                  {t("helpModal.searchExclude")}
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>site:google.com search -ads</code>
                <span className={styles.description}>
                  {t("helpModal.searchMultiple")}
                </span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t("helpModal.savingQueries")}
            </h3>
            <p className={styles.text}>
              {t("helpModal.savingQueriesDescription")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
