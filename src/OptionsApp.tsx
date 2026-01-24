import { useCallback, useEffect, useState } from "react";

import { OptionsPage } from "./components/settings/OptionsPage";
import { getSettings, resetSettings, saveSettings } from "./lib/settings";
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

  return (
    <OptionsPage
      initialSettings={initialSettings}
      onSave={handleSave}
      onReset={handleReset}
    />
  );
}

export default OptionsApp;
