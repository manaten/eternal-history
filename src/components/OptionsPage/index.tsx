import { FC } from "react";

import { t } from "../../i18n";
import { Settings, Theme } from "../../lib/settings";

interface OptionsPageProps {
  settings: Settings;
  saved: boolean;
  isLoading: boolean;
  onThemeChange: (theme: Theme) => void;
  onResultsPerPageChange: (value: number) => void;
  onHighlightMatchesChange: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

export const OptionsPage: FC<OptionsPageProps> = ({
  settings,
  saved,
  isLoading,
  onThemeChange,
  onResultsPerPageChange,
  onHighlightMatchesChange,
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

      {/* Theme Settings */}
      <section className='rounded-xl bg-white p-6 shadow-md'>
        <h2 className='mb-4 text-lg font-semibold text-gray-800'>
          {t("options.theme")}
        </h2>
        <div className='flex flex-wrap gap-3'>
          {(["light", "dark", "system"] as const).map((theme) => (
            <button
              key={theme}
              className={`
                rounded-lg px-4 py-2 text-sm font-medium transition-all
                ${
                  settings.theme === theme
                    ? "bg-primary text-white shadow-md"
                    : `
                      bg-gray-100 text-gray-700
                      hover:bg-gray-200
                    `
                }
              `}
              onClick={() => onThemeChange(theme)}
            >
              {t(
                `options.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}` as
                  | "options.themeLight"
                  | "options.themeDark"
                  | "options.themeSystem",
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Search Settings */}
      <section className='rounded-xl bg-white p-6 shadow-md'>
        <h2 className='mb-4 text-lg font-semibold text-gray-800'>
          {t("options.search")}
        </h2>

        <div className='flex flex-col gap-4'>
          {/* Results per page */}
          <div className='flex flex-col gap-2'>
            <label
              htmlFor='resultsPerPage'
              className='text-sm font-medium text-gray-700'
            >
              {t("options.resultsPerPage")}
            </label>
            <select
              id='resultsPerPage'
              value={settings.search.resultsPerPage}
              onChange={(e) => onResultsPerPageChange(Number(e.target.value))}
              className={`
                w-full max-w-[200px] rounded-lg border border-gray-300 px-3 py-2
                text-sm text-gray-700 outline-none
                focus:border-primary focus:ring-2 focus:ring-primary/20
              `}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>

          {/* Highlight matches */}
          <label className='flex cursor-pointer items-center gap-3'>
            <input
              type='checkbox'
              checked={settings.search.highlightMatches}
              onChange={(e) => onHighlightMatchesChange(e.target.checked)}
              className={`
                h-5 w-5 cursor-pointer rounded border-gray-300 text-primary
                focus:ring-2 focus:ring-primary/20
              `}
            />
            <span className='text-sm text-gray-700'>
              {t("options.highlightMatches")}
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
