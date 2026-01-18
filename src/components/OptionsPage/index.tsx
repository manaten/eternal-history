import { FC } from "react";

import { t } from "../../i18n";
import { Settings } from "../../lib/settings";

interface OptionsPageProps {
  settings: Settings;
  saved: boolean;
  isLoading: boolean;
  onGroupByUrlChange: (value: boolean) => void;
  onGroupByTitleChange: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

export const OptionsPage: FC<OptionsPageProps> = ({
  settings,
  saved,
  isLoading,
  onGroupByUrlChange,
  onGroupByTitleChange,
  onSave,
  onReset,
}) => {
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div
          className={`
            h-8 w-8 animate-spin rounded-full border-4 border-primary
            border-t-transparent
          `}
        />
      </div>
    );
  }

  return (
    <main
      className={`
        mx-auto flex min-h-screen w-full max-w-[600px] flex-col gap-6 px-4 py-8
        md:px-6 md:py-12
      `}
    >
      <h1
        className={`
          text-2xl font-bold text-white
          md:text-3xl
        `}
      >
        {t("options.title")}
      </h1>

      {/* Search Settings */}
      <section className='rounded-xl bg-white p-6 shadow-md'>
        <h2 className='mb-4 text-lg font-semibold text-gray-800'>
          {t("options.search")}
        </h2>

        <div className='flex flex-col gap-4'>
          {/* Group by URL */}
          <label className='flex cursor-pointer items-center gap-3'>
            <input
              type='checkbox'
              checked={settings.search.groupByUrl}
              onChange={(e) => onGroupByUrlChange(e.target.checked)}
              className={`
                h-5 w-5 cursor-pointer rounded border-gray-300 text-primary
                focus:ring-2 focus:ring-primary/20
              `}
            />
            <span className='text-sm text-gray-700'>
              {t("options.groupByUrl")}
            </span>
          </label>

          {/* Group by Title */}
          <label className='flex cursor-pointer items-center gap-3'>
            <input
              type='checkbox'
              checked={settings.search.groupByTitle}
              onChange={(e) => onGroupByTitleChange(e.target.checked)}
              className={`
                h-5 w-5 cursor-pointer rounded border-gray-300 text-primary
                focus:ring-2 focus:ring-primary/20
              `}
            />
            <span className='text-sm text-gray-700'>
              {t("options.groupByTitle")}
            </span>
          </label>
        </div>
      </section>

      {/* Action buttons */}
      <div className='flex flex-wrap items-center gap-3'>
        <button
          onClick={onSave}
          className={`
            rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white
            shadow-md transition-all
            hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg
            active:translate-y-0
          `}
        >
          {t("options.save")}
        </button>
        <button
          onClick={onReset}
          className={`
            rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm
            font-semibold text-gray-700 shadow-sm transition-all
            hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md
            active:translate-y-0
          `}
        >
          {t("options.reset")}
        </button>
        {saved && (
          <span className='text-sm font-medium text-emerald-100'>
            {t("options.saved")}
          </span>
        )}
      </div>
    </main>
  );
};
