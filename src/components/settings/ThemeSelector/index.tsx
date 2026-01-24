import { ComponentPropsWithoutRef, FC } from "react";

import { t } from "../../../i18n";
import { ThemeColor } from "../../../types/Settings";

interface ThemeSelectorProps {
  radioProps: ComponentPropsWithoutRef<"input">;
}

export const ThemeSelector: FC<ThemeSelectorProps> = ({ radioProps }) => {
  const THEMES: { value: ThemeColor; title: string }[] = [
    { value: "emerald", title: t("options.themeEmerald") },
    { value: "blue", title: t("options.themeBlue") },
    { value: "lime", title: t("options.themeLime") },
    { value: "red", title: t("options.themeRed") },
    { value: "purple", title: t("options.themePurple") },
  ];

  return (
    <div className='flex flex-wrap gap-3'>
      {THEMES.map((theme) => (
        <label
          key={theme.value}
          className='relative cursor-pointer'
          title={theme.title}
        >
          <input
            type='radio'
            value={theme.value}
            {...radioProps}
            className='peer sr-only'
          />
          <div
            className='
              size-8 rounded-full transition-all
              peer-checked:[box-shadow:0_0_0_3px_white,0_0_0_5px_var(--color-theme-base)]
              peer-not-checked:hover:ring-2
              peer-not-checked:hover:ring-theme-base/30
            '
            style={{
              background: `var(--color-${theme.value}-500)`,
            }}
          />
        </label>
      ))}
    </div>
  );
};
