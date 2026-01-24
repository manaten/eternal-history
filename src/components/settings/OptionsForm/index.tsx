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

  const themes: { value: ThemeColor; title: string }[] = [
    { value: "emerald", title: t("options.themeEmerald") },
    { value: "blue", title: t("options.themeBlue") },
    { value: "lime", title: t("options.themeLime") },
    { value: "red", title: t("options.themeRed") },
    { value: "purple", title: t("options.themePurple") },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      {/* Theme Settings */}
      <section className='rounded-xl bg-white p-6 shadow-md'>
        <h2 className='mb-4 text-lg font-semibold text-gray-800'>
          {t("options.theme")}
        </h2>

        <div className='flex flex-wrap gap-3'>
          {themes.map((theme) => (
            <label
              key={theme.value}
              className='relative cursor-pointer'
              title={theme.title}
            >
              <input
                type='radio'
                value={theme.value}
                {...register("theme")}
                className='sr-only'
              />
              <div
                className={`
                  size-8 rounded-full transition-all
                  ${
                    currentTheme === theme.value
                      ? "ring-4 ring-theme-base"
                      : "hover:ring-2 hover:ring-theme-base/30"
                  }
                `}
                style={{
                  background: `var(--color-${theme.value}-500)`,
                }}
              />
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
