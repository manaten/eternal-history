import { useCallback, useEffect, useState } from "react";

import { getSettings, resetSettings, saveSettings } from "./settings";
import { OptionsPage } from "./settings/components/OptionsPage";
import { applyTheme } from "./settings/theme";
import { Settings } from "./settings/types";
import { requestRebuildIndex } from "./word-index";
import { bookmarkHistoryStore } from "../common/history/store";

function OptionsApp() {
  const [initialSettings, setInitialSettings] = useState<Settings | undefined>(
    undefined,
  );

  useEffect(() => {
    getSettings().then(setInitialSettings);
  }, []);

  const handleSave = useCallback(async (settings: Settings) => {
    await saveSettings(settings);
  }, []);

  const handleReset = useCallback(async () => {
    const defaults = await resetSettings();
    setInitialSettings(defaults);
    return defaults;
  }, []);

  // DebugTools 用の副作用注入。DebugTools 自身は chrome API を直接触らず、
  // ここで wire 上げる。
  const handleRebuildIndex = useCallback(() => requestRebuildIndex(), []);
  const handleGetAllHistoryItems = useCallback(async () => {
    await bookmarkHistoryStore.initialize();
    return bookmarkHistoryStore.getAll();
  }, []);

  return (
    <OptionsPage
      initialSettings={initialSettings}
      onSave={handleSave}
      onReset={handleReset}
      onThemeChange={applyTheme}
      onRebuildIndex={handleRebuildIndex}
      onGetAllHistoryItems={handleGetAllHistoryItems}
    />
  );
}

export default OptionsApp;
