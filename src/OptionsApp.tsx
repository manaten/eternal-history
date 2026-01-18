import { useCallback, useEffect, useState } from "react";

import { OptionsPage } from "./components/OptionsPage";
import {
  DEFAULT_SETTINGS,
  getSettings,
  resetSettings,
  saveSettings,
  Settings,
  Theme,
} from "./lib/settings";

function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setIsLoading(false);
    });
  }, []);

  const handleThemeChange = useCallback((theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
    setSaved(false);
  }, []);

  const handleResultsPerPageChange = useCallback((value: number) => {
    setSettings((prev) => ({
      ...prev,
      search: { ...prev.search, resultsPerPage: value },
    }));
    setSaved(false);
  }, []);

  const handleHighlightMatchesChange = useCallback((value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      search: { ...prev.search, highlightMatches: value },
    }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleReset = useCallback(async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <OptionsPage
      settings={settings}
      saved={saved}
      isLoading={isLoading}
      onThemeChange={handleThemeChange}
      onResultsPerPageChange={handleResultsPerPageChange}
      onHighlightMatchesChange={handleHighlightMatchesChange}
      onSave={handleSave}
      onReset={handleReset}
    />
  );
}

export default OptionsApp;
