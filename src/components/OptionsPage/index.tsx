import { FC } from "react";

import { t } from "../../i18n";
import { Settings } from "../../types/Settings";
import { Button } from "../Button";
import { CheckBoxWithLabel } from "../CheckBoxWithLabel";

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
            size-8 animate-spin rounded-full border-4 border-primary
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
          <CheckBoxWithLabel
            label={t("options.groupByUrl")}
            checked={settings.search.groupByUrl}
            onChange={onGroupByUrlChange}
          />

          {/* Group by Title */}
          <CheckBoxWithLabel
            label={t("options.groupByTitle")}
            checked={settings.search.groupByTitle}
            onChange={onGroupByTitleChange}
          />
        </div>
      </section>

      {/* Action buttons */}
      <div className='flex flex-wrap items-center gap-3'>
        <Button variant='primary' onClick={onSave}>
          {t("options.save")}
        </Button>
        <Button variant='secondary' onClick={onReset}>
          {t("options.reset")}
        </Button>
        {saved && (
          <span className='text-sm font-medium text-emerald-100'>
            {t("options.saved")}
          </span>
        )}
      </div>
    </main>
  );
};
