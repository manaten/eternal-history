import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { t } from "../../i18n";
import { Settings } from "../../types/Settings";
import { Button } from "../Button";
import { CheckBoxWithLabel } from "../CheckBoxWithLabel";

interface OptionsPageProps {
  initialSettings: Settings;
  isLoading: boolean;
  onSave: (settings: Settings) => Promise<void>;
  onReset: () => Promise<Settings>;
}

export const OptionsPage: FC<OptionsPageProps> = ({
  initialSettings,
  isLoading,
  onSave,
  onReset,
}) => {
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } = useForm<Settings>({
    defaultValues: initialSettings,
  });

  // Update form when initialSettings changes (e.g., after reset)
  useEffect(() => {
    reset(initialSettings);
  }, [initialSettings, reset]);

  const onSubmit = async (data: Settings) => {
    await onSave(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetClick = async () => {
    const newSettings = await onReset();
    reset(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        mx-auto flex min-h-screen w-full max-w-150 flex-col gap-6 px-4 py-8
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

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
        {/* Search Settings */}
        <section className='rounded-xl bg-white p-6 shadow-md'>
          <h2 className='mb-4 text-lg font-semibold text-gray-800'>
            {t("options.search")}
          </h2>

          <div className='flex flex-col gap-4'>
            {/* Group by URL */}
            <CheckBoxWithLabel
              label={t("options.groupByUrl")}
              {...register("search.groupByUrl")}
            />

            {/* Group by Title */}
            <CheckBoxWithLabel
              label={t("options.groupByTitle")}
              {...register("search.groupByTitle")}
            />
          </div>
        </section>

        {/* Action buttons */}
        <div className='flex flex-wrap items-center gap-3'>
          <Button type='submit' variant='primary'>
            {t("options.save")}
          </Button>
          <Button type='button' variant='secondary' onClick={handleResetClick}>
            {t("options.reset")}
          </Button>
          {saved && (
            <span className='text-sm font-medium text-emerald-100'>
              {t("options.saved")}
            </span>
          )}
        </div>
      </form>
    </main>
  );
};
