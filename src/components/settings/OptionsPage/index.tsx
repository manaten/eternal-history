import { ComponentProps, FC } from "react";

import { t } from "../../../i18n";
import { Settings } from "../../../types/Settings";
import { Spinner } from "../../common/Spinner";
import { OptionsForm } from "../OptionsForm";

interface OptionsPageProps extends Omit<
  ComponentProps<typeof OptionsForm>,
  "initialSettings"
> {
  initialSettings: Settings | undefined;
}

export const OptionsPage: FC<OptionsPageProps> = ({
  initialSettings,
  ...props
}) => {
  if (!initialSettings) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner size='large' />
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

      <OptionsForm initialSettings={initialSettings} {...props} />
    </main>
  );
};
