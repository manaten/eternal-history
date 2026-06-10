import { useCallback, useEffect, useState } from "react";

import { OptionsPage } from "./components/settings/OptionsPage";
import { getSettings, resetSettings, saveSettings } from "./domain/settings";
import { applyTheme } from "./domain/theme";
import { bookmarkHistoryStore } from "./infra/bookmark-history-store";
import { requestRebuildIndex } from "./infra/word-index-client";
import { Settings } from "./types/Settings";

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
