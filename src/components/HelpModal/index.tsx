import { FC } from "react";

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
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4'
      onClick={handleBackdropClick}
    >
      <style>
        {`
          body {
            overflow: hidden;
          }
        `}
      </style>

      <div className='bg-white rounded-xl shadow-lg max-w-[600px] w-full max-h-[80vh] overflow-y-auto relative'>
        <div className='flex items-center justify-between px-6 pt-4 pb-4 border-b border-gray-200 mb-6'>
          <h2 className='text-2xl font-semibold text-gray-800 m-0'>
            {t("helpModal.howToUse")}
          </h2>
          <button
            className='bg-transparent border-none text-2xl text-gray-600 cursor-pointer p-3 leading-none rounded-full transition-colors duration-200 hover:text-gray-700 hover:bg-gray-100'
            onClick={onClose}
            aria-label={t("helpModal.closeModal")}
          >
            ×
          </button>
        </div>

        <div className='px-6 pb-6'>
          <section className='mb-8'>
            <h3 className='text-xl font-semibold text-gray-800 m-0 mb-4'>
              {t("helpModal.aboutThisExtension")}
            </h3>
            <p className='text-gray-800 leading-relaxed m-0'>
              {t("helpModal.aboutDescription")}
            </p>
          </section>

          <section className='mb-8'>
            <h3 className='text-xl font-semibold text-gray-800 m-0 mb-4'>
              {t("helpModal.searchSyntax")}
            </h3>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2'>
                <code className='bg-gray-100 text-gray-800 px-3 py-2 rounded-md font-mono text-sm font-medium self-start'>
                  search term
                </code>
                <span className='text-gray-600 text-sm leading-normal'>
                  {t("helpModal.searchPhrase")}
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                <code className='bg-gray-100 text-gray-800 px-3 py-2 rounded-md font-mono text-sm font-medium self-start'>
                  site:example.com
                </code>
                <span className='text-gray-600 text-sm leading-normal'>
                  {t("helpModal.searchSite")}
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                <code className='bg-gray-100 text-gray-800 px-3 py-2 rounded-md font-mono text-sm font-medium self-start'>
                  -exclude
                </code>
                <span className='text-gray-600 text-sm leading-normal'>
                  {t("helpModal.searchExclude")}
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                <code className='bg-gray-100 text-gray-800 px-3 py-2 rounded-md font-mono text-sm font-medium self-start'>
                  site:google.com search -ads
                </code>
                <span className='text-gray-600 text-sm leading-normal'>
                  {t("helpModal.searchMultiple")}
                </span>
              </div>
            </div>
          </section>

          <section className='mb-0'>
            <h3 className='text-xl font-semibold text-gray-800 m-0 mb-4'>
              {t("helpModal.savingQueries")}
            </h3>
            <p className='text-gray-800 leading-relaxed m-0'>
              {t("helpModal.savingQueriesDescription")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
