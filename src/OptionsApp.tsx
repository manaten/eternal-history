import { useCallback, useEffect, useState } from "react";

import { OptionsPage } from "./components/OptionsPage";
import { getSettings, resetSettings, saveSettings } from "./lib/settings";
import { Settings } from "./types/Settings";

function OptionsApp() {
  const [initialSettings, setInitialSettings] = useState<Settings | undefined>(
    undefined,
  );

  useEffect(() => {
    getSettings().then((s) => {
      setInitialSettings(s);
    });
  }, []);

  const handleSave = useCallback(async (settings: Settings) => {
    await saveSettings(settings);
  }, []);

  const handleReset = useCallback(async () => {
    const defaults = await resetSettings();
    setInitialSettings(defaults);
    return defaults;
  }, []);

  return (
    <OptionsPage
      initialSettings={initialSettings}
      isLoading={initialSettings === undefined}
      onSave={handleSave}
      onReset={handleReset}
    />
  );
}

export default OptionsApp;
