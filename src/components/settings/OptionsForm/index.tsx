import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { t } from "../../../i18n";
import { applyTheme } from "../../../lib/theme";
import { Settings, ThemeColor } from "../../../types/Settings";
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

  const { register, handleSubmit, reset, watch } = useForm<Settings>({
    defaultValues: initialSettings,
  });

  // Watch theme changes for live preview
  const currentTheme = watch("theme");

  // Update form when initialSettings changes (e.g., after reset)
  useEffect(() => {
    reset(initialSettings);
  }, [initialSettings, reset]);

  // Apply theme changes in real-time for preview
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

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

  const themes: { value: ThemeColor; label: string }[] = [
    { value: "emerald", label: t("options.themeEmerald") },
    { value: "blue", label: t("options.themeBlue") },
    { value: "lime", label: t("options.themeLime") },
    { value: "red", label: t("options.themeRed") },
    { value: "purple", label: t("options.themePurple") },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      {/* Theme Settings */}
      <section className='rounded-xl bg-white p-6 shadow-md'>
        <h2 className='mb-4 text-lg font-semibold text-gray-800'>
          {t("options.theme")}
        </h2>

        <div className='flex flex-wrap gap-3'>
          {themes.map(({ value, label }) => (
            <label
              key={value}
              className={`
                flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4
                py-2 transition-all
                hover:border-gray-300 hover:bg-gray-50
              `}
            >
              <input
                type='radio'
                value={value}
                {...register("theme")}
                className='size-4 cursor-pointer accent-theme-base'
              />
              <span className='text-sm font-medium text-gray-700'>{label}</span>
            </label>
          ))}
        </div>
      </section>

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
          <span className='text-sm font-medium text-theme-100'>
            {t("options.saved")}
          </span>
        )}
      </div>
    </form>
  );
};
