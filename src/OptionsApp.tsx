import { useCallback, useEffect, useState } from "react";

import { OptionsPage } from "./components/OptionsPage";
import {
  DEFAULT_SETTINGS,
  getSettings,
  resetSettings,
  Settings,
  updateSettings,
} from "./lib/settings";

function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setIsLoading(false);
    });
  }, []);

  const handleGroupByUrlChange = useCallback(
    async (value: boolean) => {
      const updated = await updateSettings({
        search: {
          groupByUrl: value,
          groupByTitle: settings.search.groupByTitle,
        },
      });
      setSettings(updated);
    },
    [settings.search.groupByTitle],
  );

  const handleGroupByTitleChange = useCallback(
    async (value: boolean) => {
      const updated = await updateSettings({
        search: { groupByUrl: settings.search.groupByUrl, groupByTitle: value },
      });
      setSettings(updated);
    },
    [settings.search.groupByUrl],
  );

  const handleReset = useCallback(async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
  }, []);

  return (
    <OptionsPage
      settings={settings}
      isLoading={isLoading}
      onGroupByUrlChange={handleGroupByUrlChange}
      onGroupByTitleChange={handleGroupByTitleChange}
      onReset={handleReset}
    />
  );
}

export default OptionsApp;
