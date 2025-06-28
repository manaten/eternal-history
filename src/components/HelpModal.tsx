import { FC } from "react";

import styles from "./HelpModal.module.css";

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
          <h2 className={styles.title}>How to use</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label='Close modal'
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>About This Extension</h3>
            <p className={styles.text}>
              Eternal History is a Chrome extension that stores unlimited
              browser history data in the bookmarks area. Unlike Chrome's
              standard history, your data is permanently preserved and never
              deleted, with advanced search capabilities to help you find any
              site you've visited.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Search Syntax</h3>
            <div className={styles.syntaxList}>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>search term</code>
                <span className={styles.description}>
                  Regular text search. Searches for strings contained in both
                  titles and URLs.
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>site:example.com</code>
                <span className={styles.description}>
                  Domain search. Returns only sites that contain the specified
                  domain.
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>-exclude</code>
                <span className={styles.description}>
                  Exclude search. Filters out results containing the specified
                  string.
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>site:google.com search -ads</code>
                <span className={styles.description}>
                  Combined search. All syntax types can be used together for
                  complex queries.
                </span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Saving Queries</h3>
            <p className={styles.text}>
              Frequently used search queries can be saved for quick access.
              Click the Save button (
              <button className={styles.dummyButton}>+</button>) next to the
              search box to save your current query. Saved queries appear below
              the search box and can be clicked to re-execute them instantly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
