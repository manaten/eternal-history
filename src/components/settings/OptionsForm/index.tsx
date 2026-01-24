import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { t } from "../../../i18n";
import { Settings } from "../../../types/Settings";
import { Button } from "../../common/Button";
import { CheckBoxWithLabel } from "../../common/CheckBoxWithLabel";

interface OptionsFormProps {
  initialSettings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  onReset: () => Promise<Settings>;
}

export const OptionsForm: FC<OptionsFormProps> = ({
  initialSettings,
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

  return (
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
  );
};
