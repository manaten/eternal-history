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
          <h2 className={styles.title}>{t("howToUse")}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t("closeModal")}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("aboutThisExtension")}</h3>
            <p className={styles.text}>{t("aboutDescription")}</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("searchSyntax")}</h3>
            <p className={styles.text}>{t("searchSyntaxDescription")}</p>
            <div className={styles.syntaxList}>
              <div className={styles.syntaxItem}>
                <strong>{t("searchExactPhrase")}</strong>
                <code className={styles.code}>
                  {t("searchExactPhraseExample")}
                </code>
              </div>
              <div className={styles.syntaxItem}>
                <strong>{t("searchExclude")}</strong>
                <code className={styles.code}>{t("searchExcludeExample")}</code>
              </div>
              <div className={styles.syntaxItem}>
                <strong>{t("searchSite")}</strong>
                <code className={styles.code}>{t("searchSiteExample")}</code>
              </div>
              <div className={styles.syntaxItem}>
                <strong>{t("searchMultiple")}</strong>
                <code className={styles.code}>
                  {t("searchMultipleExample")}
                </code>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t("savingQueries")}</h3>
            <p className={styles.text}>{t("savingQueriesDescription")}</p>
          </section>
        </div>
      </div>
    </div>
  );
};
