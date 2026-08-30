import { ComponentProps, FC } from "react";

import { HistoryItem } from "../../../../common/history/domain/types";
import { RebuildIndexResponse } from "../../../../common/messages";
import { t } from "../../../i18n";
import { Settings } from "../../../types/Settings";
import { Spinner } from "../../common/Spinner";
import { DebugTools } from "../DebugTools";
import { OptionsForm } from "../OptionsForm";

interface OptionsPageProps extends Omit<
  ComponentProps<typeof OptionsForm>,
  "initialSettings"
> {
  initialSettings: Settings | undefined;
  /** DebugTools (dev のみ表示) に転送する副作用群。 */
  onRebuildIndex: () => Promise<RebuildIndexResponse>;
  onGetAllHistoryItems: () => Promise<HistoryItem[]>;
}

export const OptionsPage: FC<OptionsPageProps> = ({
  initialSettings,
  onRebuildIndex,
  onGetAllHistoryItems,
  ...formProps
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

      <OptionsForm initialSettings={initialSettings} {...formProps} />

      {__DEV_BUILD__ && (
        <DebugTools
          onRebuildIndex={onRebuildIndex}
          onGetAllHistoryItems={onGetAllHistoryItems}
        />
      )}

      <footer className='mt-auto pt-8 text-center text-sm text-gray-400'>
        Eternal History by{" "}
        <a
          href='https://manaten.net'
          target='_blank'
          rel='noopener noreferrer'
          className='
            text-emerald-400 underline transition-colors
            hover:text-white
          '
        >
          manaten
        </a>
      </footer>
    </main>
  );
};
