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
          <h2 className={styles.title}>ヘルプ</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label='モーダルを閉じる'
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>この拡張について</h3>
            <p className={styles.text}>
              Eternal
              Historyは、Chromeの履歴をブックマーク領域に無制限に保存する拡張機能です。
              通常のChromeの履歴とは異なり、データが削除されることなく永続的に保管され、
              高度な検索機能でいつでも過去のサイトを見つけることができます。
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>検索構文</h3>
            <div className={styles.syntaxList}>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>search term</code>
                <span className={styles.description}>
                  通常のテキスト検索。タイトルとURLに含まれる文字列を検索します。
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>site:example.com</code>
                <span className={styles.description}>
                  ドメイン検索。指定したドメインを含むサイトのみを検索します。
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>-exclude</code>
                <span className={styles.description}>
                  除外検索。指定した文字列を含む結果を除外します。
                </span>
              </div>
              <div className={styles.syntaxItem}>
                <code className={styles.code}>site:google.com search -ads</code>
                <span className={styles.description}>
                  複合検索。すべての構文を組み合わせて使用できます。
                </span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>クエリの保存</h3>
            <p className={styles.text}>
              よく使用する検索クエリは保存することができます。
              検索ボックスの右側にある「保存」ボタンを押すと、現在のクエリが保存され、
              次回から簡単にアクセスできるようになります。
              保存されたクエリは検索ボックス下に表示され、クリックで再実行できます。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
