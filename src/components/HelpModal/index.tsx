import { FC } from "react";

import { t } from "../../i18n";

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h3 className='m-0 mb-4 text-xl font-semibold text-gray-800'>{children}</h3>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className='m-0 leading-relaxed text-gray-800'>{children}</p>
);

const TermExample = ({ term, text }: { term: string; text: string }) => (
  <div className='flex flex-col gap-2'>
    <code
      className={`
        self-start rounded-md bg-gray-100 px-3 py-2 font-mono text-sm
        font-medium text-gray-800
      `}
    >
      {term}
    </code>
    <span className='text-sm leading-normal text-gray-600'>{text}</span>
  </div>
);

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
    <div
      className={`
        fixed inset-0 z-1000 flex items-center justify-center bg-black/50 p-4
      `}
      onClick={handleBackdropClick}
    >
      <style>
        {`
          body {
            overflow: hidden;
          }
        `}
      </style>

      <div
        className={`
          relative max-h-[80vh] w-full max-w-[600px] overflow-y-auto rounded-xl
          bg-white shadow-lg
        `}
      >
        <div
          className={`
            mb-6 flex items-center justify-between border-b border-gray-200 py-4
            pr-1 pl-6
          `}
        >
          <h2 className='m-0 text-2xl font-semibold text-gray-800'>
            {t("helpModal.howToUse")}
          </h2>
          <button
            className={`
              flex size-12 cursor-pointer items-center justify-center
              rounded-full border-none bg-transparent text-2xl leading-none
              text-gray-600 transition-colors duration-200
              hover:bg-gray-100 hover:text-gray-700
            `}
            onClick={onClose}
            aria-label={t("helpModal.closeModal")}
          >
            ×
          </button>
        </div>

        <div className='flex flex-col gap-8 px-6 pb-6'>
          <section>
            <Heading>{t("helpModal.aboutThisExtension")}</Heading>
            <Paragraph>{t("helpModal.aboutDescription")}</Paragraph>
          </section>

          <section>
            <Heading>{t("helpModal.searchSyntax")}</Heading>
            <div className='flex flex-col gap-4'>
              <TermExample
                term='search term'
                text={t("helpModal.searchPhrase")}
              />
              <TermExample
                term='site:example.com'
                text={t("helpModal.searchSite")}
              />
              <TermExample
                term='-exclude'
                text={t("helpModal.searchExclude")}
              />
              <TermExample
                term='site:google.com search -ads'
                text={t("helpModal.searchMultiple")}
              />
            </div>
          </section>

          <section>
            <Heading>{t("helpModal.savingQueries")}</Heading>
            <Paragraph>{t("helpModal.savingQueriesDescription")}</Paragraph>
          </section>
        </div>
      </div>
    </div>
  );
};
